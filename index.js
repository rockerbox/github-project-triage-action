const core = require('@actions/core');
const github = require('@actions/github');

const { buildAddCard, buildConvertCard, buildProjectQuery } = require('./src/api');
const { processNoteToIssue, processProjects } = require('./src/process');

(async () => {
  try {
    const token = core.getInput('token');
    const triageProject = core.getInput('triage-project');
    const backlogColumn = core.getInput('backlog-column');
  
    const { eventName, payload } = github.context
    const repoUrl = payload.repository.html_url;
    const repoId = payload.repository.node_id;
    const cardDatabaseId = payload.project_card.id;
  
    const octokit = new github.GitHub(token);


    const projectCardQuery = buildProjectQuery(repoUrl, triageProject, `search: "${triageProject}"`)
    const cardResp = await octokit.graphql(projectCardQuery);
    const { byCardId } = processProjects(cardResp.resource.projects)

    const projectAllQuery = buildProjectQuery(repoUrl, triageProject)
    const { resource: { projects } } = await octokit.graphql(projectAllQuery);
    const { projectByName } = processProjects(projects)

    const card = byCardId[cardDatabaseId];
    const { columnName, projectName, note, cardNodeId } = card

    console.log(JSON.stringify(projects))
    console.log(`Move:(${cardDatabaseId}, ${cardDatabaseId}) From: ${projectName} to ${columnName}`);

    const isTriageBoard = projectName == triageProject

    const project = projectByName[columnName] || {};
    const { columns = {} } = project;
    const backlog = columns['Backlog'] || {};
    const { columnNodeId } = backlog

    const targetBoardExists = !!columnNodeId
    

    if (isTriageBoard && targetBoardExists) {

      let contentNodeId = card.contentNodeId;

      if (note) {
        const { title, body } = processNoteToIssue(note)
        const mutation = buildConvertCard(cardNodeId, title, body, repoId)
        const converted = await octokit.graphql(mutation)

        const projectQuery = buildProjectQuery(repoUrl, triageProject, `search: "${triageProject}"`)

        const { resource: { projects } } = await octokit.graphql(projectQuery);

        const { byCardId } = processProjects(projects)
        const card = byCardId[cardDatabaseId];
        console.log(JSON.stringify(card))
        contentNodeId = card.contentNodeId
      }
      console.log(`Content ID: ${contentNodeId}`)
   
      const addCardMutation = buildAddCard(contentNodeId, columnNodeId)
      const addedCard = await octokit.graphql(addCardMutation)

      console.log(`Added card: ${JSON.stringify(addedCard)}`)
    }
    
  } catch (error) {
    core.setFailed(error.message);
  }
})()
