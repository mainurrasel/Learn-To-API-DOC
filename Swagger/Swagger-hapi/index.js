const Hapi = require('@hapi/hapi');
const Inert = require('@hapi/inert');
const Vision = require('@hapi/vision');
const HapiSwagger = require('hapi-swagger');
const Pack = require('./package');
const fs = require('fs');
const util = require('util');
const Joi = require('@hapi/joi');

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

(async () => {
    const server = await new Hapi.Server({
        host: 'localhost',
        port: 3000,
    });

    const swaggerOptions = {
        info: {
                title: 'Books API Documentation',
                version: Pack.version,
            },
        };

    await server.register([
        Inert,
        Vision,
        {
            plugin: HapiSwagger,
            options: swaggerOptions
        }
    ]);

    try {
        await server.start();
        console.log('Server running at:', server.info.uri);
    } catch(err) {
        console.log(err);
    }

    server.route({
        method: 'GET',
        path: '/',
        handler: (request, h) => {
            return 'Hello World!';
        }
    });

    server.route({
        method: 'GET',
        path: '/book-list',
        options: {
          description: 'Get book list',
            notes: 'Returns an array of books',
            tags: ['api'],
            handler: async (request, h) => {
                let books = await readFile('./books.json', 'utf8');
                return h.response(JSON.parse(books));
            }
        }
    });

    server.route({
        method: 'POST',
        path: '/add-book',
        options: {
            description: 'Add new book in book-list',
            notes: 'Returns an array of books',
            tags: ['api'],
            handler: async (request, h) => {
                let book = request.payload;
                let books = await readFile('./books.json', 'utf8');
                books = JSON.parse(books);
                book.id = books.length + 1;
                books.push(book);
                await writeFile('./books.json', JSON.stringify(books, null, 2), 'utf8');
                return h.response(books).code(200);
            }
        }
    });
    
    server.route({
        method: 'PUT',
        path: '/update-book-list/{id}',
        options: {
            description: 'Update book detail in book-list',
            notes: 'Returns an array of books',
            tags: ['api'],
            handler: async (request, h) => {
                let updBook = request.payload;
                const id = request.params.id;
                let books = await readFile('./books.json', 'utf8');
                books = JSON.parse(books);
                books.forEach((book) => {
                    if (book.id == id) {
                        book.title = updBook.title;
                        book.author = updBook.author;
                    }
                });
                await writeFile('./books.json', JSON.stringify(books, null, 2), 'utf8');
                return h.response(books).code(200);
            }
        }
    });
    
    server.route({
        method: 'DELETE',
        path: '/delete-book/{id}',
        options: {
            description: 'Delete book from book-list',
            notes: 'Returns an array of books',
            tags: ['api'],
            handler: async (request, h) => {
                let updBook = JSON.parse(request.payload);
                const id = request.params.id;
                let books = await readFile('./books.json', 'utf8');
                books = JSON.parse(books);
                books = books.filter(book => book.id != id);
                await writeFile('./books.json', JSON.stringify(books, null, 2), 'utf8');
                return h.response(books).code(200);
            }
        }
    });

})();