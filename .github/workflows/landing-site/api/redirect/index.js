module.exports = async function (context, req) {
    context.res = {
        status: 302,
        headers: {
            Location: "https://v0048.teesa.ai/"
        }
    };
};