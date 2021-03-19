const cardFragment = `
                cards( archivedStates: [NOT_ARCHIVED] ) {
                  nodes {
                    id
                    databaseId
                    state
                    content {
                      ... on Issue {
                        id
                        databaseId
                        url
                        title
                        body
                        labels( first: 10) { 
                          nodes { 
                            name 
                          } 
                        }
                        projectCards( first: 10) {
                          nodes {
                            id
                            databaseId
                          }
                        }
                      }
                    }
                    note
                    resourcePath
                  }
                }
`

const buildProjectQuery = (url, project, limitProject = "") => (
  `query {
    resource( url: "${url}" ) {
      ... on Repository {
        projects(first: 20, states: [OPEN] ${limitProject}) {
          nodes {
            name
            id
            databaseId
            columns( first: 100 ) {
              nodes {
                id
                databaseId
                name
                ${limitProject != "" ? cardFragment : ""}
              }
            }
          }
        }
      }
    }
  }`
);

const buildConvertCard = (cardId, title, body, repoId) => (
  `mutation {
     convertProjectCardNoteToIssue( input: {
       body: "${body.replace(/"/g,'\\"')}",
       projectCardId: "${cardId}",
       repositoryId: "${repoId}",
       title: "${title.replace(/"/g,'\\"')}"
     }) { clientMutationId }
  }`
)

const buildAddCard = (contentNodeId, columnNodeId) => (
  `mutation {
    addProjectCard( input: { 
      contentId: "${ contentNodeId }", 
      projectColumnId: "${ columnNodeId }" 
    }) { clientMutationId }
  }`
)

module.exports = {
  buildAddCard,
  buildProjectQuery,
  buildConvertCard
};
