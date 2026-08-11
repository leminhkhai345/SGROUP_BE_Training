import express from 'express';

const app = express();
app.get("", (req, res) => {
    res.send("<a href='/about'>About Me</a>");
});
    
app.get("/about", (req, res) => {
    res.send("<a href='/hello'>Hello</a>");
});

app.listen(3000, () => {
    console.log("app is runing at port 3000");
})