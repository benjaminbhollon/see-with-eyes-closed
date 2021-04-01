const config = require('../config.json');
const crud = require('@bibliobone/mongodb-crud').bind(config.mongodbURI, 'swec-core');

crud.updateMultipleDocuments('articles', { reactions: { $exists: false } }, {
  reactions: [
    {
      name: 'impressive',
      count: 0,
    },
    {
      name: 'funny',
      count: 0,
    },
    {
      name: 'hooray',
      count: 0,
    },
    {
      name: 'silly',
      count: 0,
    },
    {
      name: 'avocado',
      count: 0,
    },
  ],
}).then((result) => {
  console.log(result);
});
