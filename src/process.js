
const processProjects = (projects) => {
  const byCardId = {}
  const projectByName = {}
  const byProjectNameColumnName = projects.nodes.reduce((p, project) => {
    const { columns, name } = project
    p[name] = {}
    projectByName[name] = project

    const columnsByName = {}

    columns.nodes.reduce((q, column) => {
      const { cards = {nodes:[]}, name } = column
      columnsByName[name] = column
      columnsByName[name].columnNodeId = column.id
      columnsByName[name].columnDatabaseId = column.databaseId
      q[name] = {}

      cards.nodes.map(card => {
        q[name][card.databaseId] = card

        byCardId[card.databaseId] = Object.assign({
          note: card.note,
          cardNodeId: card.id,
          contentId: (card.content||{}).databaseId,
          contentNodeId: (card.content||{}).id,
          projectName: project.name, 
          projectId: project.databaseId, 
          columnName: name,
          columnId: column.databaseId, 
        }, {})
      })
      return q
    }, p[project.name])
    projectByName[name].columns = columnsByName
  
    return p
  }, {})

  return {
    byCardId,
    projectByName, 
    byProjectNameColumnName
  }
}

const processNoteToIssue = (note) => {
  const splitNote = note.split("\n")
  const [title, ...bodyArr] = splitNote;
  const body = bodyArr.join("\n")

  return { title, body }
}

module.exports = {
  processProjects,
  processNoteToIssue
};
