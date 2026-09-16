require('dotenv').config({ quiet: true });
const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`SBIMS backend listening on port ${PORT}`);
});
