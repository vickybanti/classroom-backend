import express from "express";
import subjectRouter from './routes/subjects'
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors({
    origin: process.env.FRONTEND_URL,
    methods:['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,

}))

app.use(express.json());

app.use('/api/subjects', subjectRouter);

app.get("/", (req: express.Request, res: express.Response) => {
    res.send("Welcome to classrom API!");
})

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})