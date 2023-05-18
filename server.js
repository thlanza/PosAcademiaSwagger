const fs = require('fs');
const jsonServer = require('json-server');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const swaggerUi = require('swagger-ui-express');
const swaggerDocs = require('./swagger.json');

const server = jsonServer.create()
const router = jsonServer.router('./db.json')
// const routerComprovantes = jsonServer.router('./comprovantes.json')

const admindb = JSON.parse(fs.readFileSync('./admin.json', 'UTF-8'));
const alunodb = JSON.parse(fs.readFileSync('./alunos.json', 'UTF-8'));

const cors = require('cors');

server.use(cors({
  origin: '*'
}))
server.use(bodyParser.urlencoded({extended: true}))
server.use(bodyParser.json())
server.use(jsonServer.defaults());
server.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

const SECRET_KEY = '123456789'

const expiresIn = '30h'

// Create a token from a payload 
function createToken(payload){
  return jwt.sign(payload, SECRET_KEY, {expiresIn})
}

// Verify the token 
function verifyToken(token){
  return  jwt.verify(token, SECRET_KEY, (err, decode) => decode !== undefined ?  decode : err)
}

// Check if the user exists in database
function isAuthenticatedAdmin({email, password}){
  return admindb.admin.findIndex(user => user.email === email && user.password === password) !== -1
}

function isAuthenticatedAluno({email, password}){
    return alunodb.alunos.findIndex(user => user.email === email && user.password === password) !== -1
  }


// Registrar novo administrador
server.post('/admin/auth/registrar', (req, res) => {
    console.log("Endpoint de registro chamado; corpo da requisição:");
    console.log(req.body);
    const {email, password, primeiroNome, sobrenome, fotoDePerfil } = req.body;
  
    if(isAuthenticatedAdmin({email, password}) === true) {
      const status = 400;
      const message = 'Email e Senha já existem.';
      res.status(status).json({status, message});
      return
    }
  
  fs.readFile("admin.json", (err, data) => {  
      if (err) {
        const status = 401
        const message = err
        res.status(status).json({status, message})
        return
      };
  
      // Obter dados dos atuais administradores
      var data = JSON.parse(data.toString());
  
      // Pegar o id do último administrador
      var last_item_id = data.admin[data.admin.length-1].id;
  
      //Adicionar novo administrador
      data.admin.push({id: last_item_id + 1, email, password, primeiroNome, sobrenome, fotoDePerfil}); //add some data
      var writeData = fs.writeFile("admin.json", JSON.stringify(data), (err, result) => {  // WRITE
          if (err) {
            const status = 401
            const message = err
            res.status(status).json({status, message})
            return
          }
      });
    });

  const access_token = createToken({email, password})
  console.log("Token de acesso:" + access_token);
  res.status(200).json({access_token})
});

// Login do administrador do sistema
server.post('/admin/auth/login', (req, res) => {
  console.log("Endpoint de login chamado; corpo da requisição:");
  console.log(req.body);
  const {email, password} = req.body;
  if (isAuthenticatedAdmin({email, password}) === false) {
    const status = 401
    const message = 'Email ou senha incorreta'
    res.status(status).json({status, message})
    return
  }
  const access_token = createToken({email, password})
  console.log("Token de acesso:" + access_token);
  res.status(200).json({access_token})
});

// Deletar admin
server.delete('/admin/auth/:id', (req, res) => {
  try {
  fs.readFile("admin.json", (err, data) => {  
      if (err) {
        const status = 401
        const message = err
        console.log(err);
        res.status(status).json({status, message})
        return
      };
  
      // Pegar os alunos atuais
      var data = JSON.parse(data.toString());
  
      // Pegar o id do último aluno
      const { id } = req.params;
   
      //Filtrar o array para tirar o elemento
      function removeObjectoComId(arr, id) {
        return arr.filter((obj) => obj.id != id);
      }
      let admin = data.admin;
      let newAlunos = removeObjectoComId(admin, id);
  
      data.admin = newAlunos;
    
      //Salvar no json
      var writeData = fs.writeFile("admin.json", JSON.stringify(data), (err, result) => {  // WRITE
          if (err) {
            const status = 401
            const message = err
            console.log(err);
            res.status(status).json({status, message})
            return
          }
      });
    });
  } catch(err) {
    console.log(err);
  }
    return res.status(200).json({});
  });

// Matricular aluno
server.post('/aluno/auth/registrar', (req, res) => {
    console.log("Endpoint de registro chamado; corpo da requisição:");
    console.log(req.body);
    const {email, password, primeiroNome, sobrenome, fotoDePerfil, modalidade, inadimplente, mesesInadimplente } = req.body;
  
    if(isAuthenticatedAluno({email, password}) === true) {
      const status = 400;
      const message = 'Email e Senha já existem.';
      res.status(status).json({status, message});
      return
    }
  
  fs.readFile("alunos.json", (err, data) => {  
      if (err) {
        const status = 401
        const message = err
        res.status(status).json({status, message})
        return
      };
  
      // Pegar os alunos atuais
      var data = JSON.parse(data.toString());
  
      // Pegar o id do último aluno
      var last_item_id = data.alunos[data.alunos.length-1].id;
  
      //Matricular novo aluno
      data.alunos.push({id: last_item_id + 1, email, password, primeiroNome, sobrenome, fotoDePerfil, modalidade, inadimplente, mesesInadimplente }); //add some data
      var writeData = fs.writeFile("alunos.json", JSON.stringify(data), (err, result) => {  // WRITE
          if (err) {
            const status = 401
            const message = err
            res.status(status).json({status, message})
            return
          }
      });
    });

  const access_token = createToken({email, password})
  console.log("Token de acesso:" + access_token);
  res.status(200).json({access_token})
});

// Deletar aluno
server.delete('/aluno/auth/admin/:id', (req, res) => {
try {
fs.readFile("alunos.json", (err, data) => {  
    if (err) {
      const status = 401
      const message = err
      console.log(err);
      res.status(status).json({status, message})
      return
    };

    // Pegar os alunos atuais
    var data = JSON.parse(data.toString());

    // Pegar o id do último aluno
    const { id } = req.params;

 
    //Filtrar o array para tirar o elemento
    function removeObjectoComId(arr, id) {
      return arr.filter((obj) => obj.id != id);
    }
    let alunos = data.alunos;
    let newAlunos = removeObjectoComId(alunos, id);

    data.alunos = newAlunos;
  
    //Salvar no json
    var writeData = fs.writeFile("alunos.json", JSON.stringify(data), (err, result) => {  // WRITE
        if (err) {
          const status = 401
          const message = err
          console.log(err);
          res.status(status).json({status, message})
          return
        }
    });
  });
  } catch(err) {
    console.log(err);
  }
  return res.status(200).json({});
});

// Login do administrador do sistema
server.post('/aluno/auth/login', (req, res) => {
    console.log("Endpoint de login chamado; corpo da requisição:");
    console.log(req.body);
    const {email, password} = req.body;
    if (isAuthenticatedAluno({email, password}) === false) {
      const status = 401
      const message = 'Email ou senha incorreta'
      res.status(status).json({status, message})
      return
    }
    const access_token = createToken({email, password})
    console.log("Token de acesso:" + access_token);
    res.status(200).json({access_token})
  });

server.use(/^(?!\/auth).*$/,  (req, res, next) => {
  if (req.headers.authorization === undefined || req.headers.authorization.split(' ')[0] !== 'Bearer') {
    const status = 401
    const message = 'Erro no formato da autorização'
    res.status(status).json({status, message})
    return
  }
  try {
    let verifyTokenResult;
     verifyTokenResult = verifyToken(req.headers.authorization.split(' ')[1]);

     if (verifyTokenResult instanceof Error) {
       const status = 401
       const message = 'Token de acesso não provido'
       res.status(status).json({status, message})
       return
     }
     next()
  } catch (err) {
    const status = 401
    const message = 'Erro, acesso revogado'
    res.status(status).json({status, message})
  }
})

server.use(router)
// server.use(routerComprovantes)

server.listen(5000, () => {
  console.log('Servidor Mock')
});