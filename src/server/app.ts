import express, { Request, Response } from 'express';
const queries = require("./queries.js");
const app = express();
const bodyParser = require('body-parser')

app.use('/bundles', express.static(`public/bundles`, { maxAge: 604800e3 }));
app.use(express.static(`public`, { maxAge: 604800e3 }));
app.use(bodyParser.json())
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
)

app.get('/rates', queries.getRates)
app.post('/rates', queries.createRate)

app.get('/', async (req: Request, res: Response) => {
  try {
    // Disable caching of index file
    res.setHeader('Surrogate-Control', 'no-store');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    const html = `
      <html>
        <head>
          <title>App</title>
        </head>
        <body>
          <div id="app"></div>
          <script src="/bundles/main.bundle.js"></script>
        </body>
      </html>
    `
    res.send(html);
  } catch (err) {
    console.error(err);
  }
});

app.listen(3000, '0.0.0.0', () => console.log('App is running'))
