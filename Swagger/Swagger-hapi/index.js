const Hapi = require('@hapi/hapi');
const Inert = require('@hapi/inert');
const Vision = require('@hapi/vision');
const HapiSwagger = require('hapi-swagger');
const Pack = require('./package');
const fs = require('fs');
const util = require('util');
const Joi = require('joi');
const _ = require("underscore");
const Util = require("core-util-is");

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

const payload_scheme = Joi.object({
    author: Joi.string().min(3).max(30).required(),
    title: Joi.string().min(3).max(30).required(),
});

const param_scheme = Joi.object({
    id: Joi.string().required()
});

(async () => {
    const server = await new Hapi.Server({
        host: 'localhost',
        port: 3000,
    });

    //specify our documentation and the version number
    const swaggerOptions = {
        info: {
            title: 'Books API Documentation',
            version: Pack.version,
        },
    };

    //register (before the server starts) all plugins and Swagger configuration
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
    } catch (err) {
        console.log(err);
    }

    //Adding description, tags, notes to API routes
    server.route({
        method: 'GET',
        path: '/',
        handler: (request, h) => {
            return 'Hello World!';
        }
    });

    //Adding description, tags, notes to API routes
    server.route({
        method: 'GET',
        path: '/book-list',
        options: {
            description: 'Get book list',
            notes: 'Returns an array of books',
            tags: ['api'],
        },
        handler: async (request, h) => {
            let books = await readFile('./books.json', 'utf8');
            return h.response(JSON.parse(books));
        },
    });

    //Adding description, tags, notes to API routes with path param
    server.route({
        method: 'GET',
        path: '/book-with-path-param/{id}',
        options: {
            description: 'Get book list with path param',
            notes: 'Returns an object of book',
            tags: ['api'],
            validate: {
                params: Joi.object({
                    id: Joi.number(),
                }),
                failAction: async (request, h, err) => {
                    return h.response({ code: 301, status: false, message: err?.message }).takeover();
                },
            },
        },
        handler: async (request, h) => {
            let books = await readFile('./books.json', 'utf8');
            let findbook = null;
            findbook = _.findWhere(JSON.parse(books), { id: request.params.id })
            return `${(JSON.stringify(findbook))}`;
        },
    });

    //Adding description, tags, notes to API routes with query param
    server.route({
        method: 'GET',
        path: '/book-with-query-param',
        options: {
            description: 'Get book list with query path param',
            notes: 'Returns an object of book',
            tags: ['api'],
            validate: {
                query: Joi.object({
                    id: Joi.number(),
                    author: Joi.string(),
                    title: Joi.string(),
                }),
                failAction: async (request, h, err) => {
                    return h.response({ code: 301, status: false, message: err?.message }).takeover();
                },
            },
        },
        handler: async (request, h) => {
            let books = await readFile('./books.json', 'utf8');
            let findbook = null;
            let param = {};

            if (request.query.id) {
                param = _.extend(param, { id: request.query.id })
            }
            if (request.query.author) {
                param = _.extend(param, { author: request.query.author })
            }
            if (request.query.title) {
                param = _.extend(param, { title: request.query.title })
            }
            findbook = _.where(JSON.parse(books), param)
            return `${(JSON.stringify(findbook))}`;
        },
    });

    //Adding description, tags, notes to API routes
    server.route({
        method: 'POST',
        path: '/add-book',
        options: {
            description: 'Add new book in book-list',
            notes: 'Returns an array of books',
            tags: ['api'],
            validate: {
                payload: payload_scheme,
                failAction: async (request, h, err) => {
                    return h.response({ code: 301, status: false, message: err?.message }).takeover();
                },
            },
        },
        handler: async (request, h) => {
            let book = request.payload;
            let books = await readFile('./books.json', 'utf8');
            books = JSON.parse(books);
            book.id = books.length + 1;
            books.push(book);
            await writeFile('./books.json', JSON.stringify(books, null, 2), 'utf8');
            return h.response(books).code(200);
        },
    });

    //Adding description, tags, notes to API routes
    server.route({
        method: 'PUT',
        path: '/update-book-list/{id}',
        options: {
            description: 'Update book detail in book-list',
            notes: 'Returns an array of books',
            tags: ['api'],
            validate: {
                params: param_scheme,
                payload: payload_scheme,
            },
        },
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
        },
    });

    //Adding description, tags, notes to API routes
    server.route({
        method: 'DELETE',
        path: '/delete-book/{id}',
        options: {
            description: 'Delete book from book-list',
            notes: 'Returns an array of books',
            tags: ['api'],
            validate: {
                params: param_scheme,
            },
        },
        handler: async (request, h) => {
            let updBook = JSON.parse(request.payload);
            const id = request.params.id;
            let books = await readFile('./books.json', 'utf8');
            books = JSON.parse(books);
            books = books.filter(book => book.id != id);
            await writeFile('./books.json', JSON.stringify(books, null, 2), 'utf8');
            return h.response(books).code(200);
        }
    });

})();