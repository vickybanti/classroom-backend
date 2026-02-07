import express from 'express';
import {db} from "../db/index.js";
import {classes, departments, subjects} from "../db/schema/app.js";
import {and, desc, eq, getTableColumns, ilike, or, sql} from "drizzle-orm";
import e from "cors";
import {user} from "../db/schema/auth.js";

const router = express.Router();

router.post('/', async (req: express.Request, res: express.Response) => {
    try {
        const [createdClass] = await db.insert(classes)
            .values({...req.body, inviteCode:Math.random().toString(36).substring(2,9), schedules:[]})
            .returning({id: classes.id})
        if(!createdClass) return res.status(404).send("No Classes Found");

        res.status(201).json({data: createdClass});
    }catch (e) {
        console.error(`POST /classes error ${e}`);
        res.status(500).json({error: e});
    }
});

router.get('/', async (req, res) => {
   try {
       const {search, subject, teacher, page = 1, limit = 10} = req.query;

       const currentPage = Math.max(1, parseInt(String(page), 10) || 1);
       const limitPage = Math.min(Math.max(1, parseInt(String(limit), 10) || 10), 100)

       const offset = (currentPage - 1) * limitPage;

       const filterConditions = [];

       if (search) {
           filterConditions.push(
               or(
                   ilike(classes.name, `%${search}%`),
                   ilike(classes.inviteCode, `%${search}%`)
               )
           );
       }
       if (subject) {
           const subjectPattern = `%${String(subject).replace(/[%_]/g, '\\$&')}%`;
           filterConditions.push(ilike(subjects.name, subjectPattern));
       }

       const whereClause = filterConditions.length > 0 ? and(...filterConditions) : undefined;

       const countResult = await db
           .select({count: sql<number>`count(*)`})
           .from(classes).leftJoin(subjects, eq(classes.subjectId, subjects.id))
           .leftJoin(user, eq(classes.teacherId, user.id))
           .where(whereClause);

       const totalCount = countResult[0]?.count ?? 0;
       const classesList = await db.select({
           ...getTableColumns(classes),
           subject: {...getTableColumns(subjects)},
           teacher: {...getTableColumns(user)},
       }).from(classes)
           .leftJoin(subjects, eq(classes.subjectId, subjects.id))
           .leftJoin(user, eq(classes.teacherId, user.id))
           .where(whereClause).orderBy(desc(classes.createdAt))
           .limit(limitPage)
           .offset(offset);
       res.status(200).json({
           data: classesList,
           pagination: {
               page: currentPage,
               limit: limitPage,
               total: totalCount,
               totalPages: Math.ceil(totalCount / limitPage),
           }
       });
   } catch (error) {
       console.error(`POST /classes error ${e}`);
   }
}

)

router.get('/:id', async(req, res) => {
    const classId = Number(req.params.id);
    if(!Number.isFinite(classId)) return res.status(404).send("No Classes Found");

    const [classDetails] = await db.select({
        ...getTableColumns(classes),

        subject:{
        ...getTableColumns(subjects),
    },
        department: {
        ...getTableColumns(departments),
    },
    teacher: {
        ...getTableColumns(user),
    }
    }).from(classes)
        .leftJoin(subjects, eq(classes.subjectId, subjects.id))
        .leftJoin(user, eq(classes.teacherId, user.id))
        .leftJoin(departments, eq(subjects.departmentId, departments .id))
        .where(eq(classes.id, classId))

    if(!classDetails) return res.status(404).json({error:"No Classes Found"});

    res.status(200).json({data:classDetails});
})

export default router;
