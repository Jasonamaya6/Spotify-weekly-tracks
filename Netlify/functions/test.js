// netlify/functions/test.js
exports.handler = async function(event, context) {
    return {
        statusCode: 200,
        body: "Hello from Netlify Functions!"
    };
};
