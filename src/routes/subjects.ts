import express from 'express';
import {or, ilike, and, sql, eq, getTableColumns, desc} from 'drizzle-orm';
import {departments, subjects} from '../db/schema/index.js'
import {db} from '../db/index.js';

const router = express.Router();



router.get('/', async(req: express.Request, res: express.Response) => {
    try {
        const { search, department, page=1, limit=10 } = req.query;

        const currentPage = Math.max(1, parseInt(String(page), 10) || 1);
        const limitPerPage = Math.min(Math.max(1,parseInt(String(limit),10)||10),100);

        //offset is the number of records to skips per page
        const offset = (currentPage - 1) * limitPerPage;
        const filterConditions = [];

        //if search query exists, filter by subjects name or subject code
        if(search){
            filterConditions.push(
                or(
                    ilike(subjects.name,`%${search}%`),
                    ilike(subjects.code,`%${search}%`)
                )
            )

        }
        if(department){
            const deptPattern = `%${String(department).replace(/[%_]/g, '\\$&')}%`;

            filterConditions.push(ilike(departments.name,deptPattern));
        }

        //combine all filters using AND if any exists

        const whereClause = filterConditions.length > 0 ?and(...filterConditions):undefined
        const countResult = await db
            .select({count:sql<number>`count(*)`})
            .from(subjects)
            .leftJoin(departments, eq(subjects.departmentId, departments.id))
            .where(whereClause);

        const totalCount = countResult[0]?.count ?? 0;

        const subjectsList = await db
            .select({...getTableColumns(subjects),
            department:{...getTableColumns(departments)}})
            .from(subjects).leftJoin(departments, eq(subjects.departmentId,departments.id))
            .where(whereClause)
            .orderBy(desc(subjects.createdAt))
            .limit(limitPerPage)
            .offset(offset);

        res.status(200).json({
            data:subjectsList,
            pagination:{
                page:currentPage,
                limit:limitPerPage,
                total: totalCount,
                totalPages: Math.ceil(totalCount/totalCount),

            }
        })
    } catch (e){
        console.error(e)
        res.status(404).json({error: 'Failed to get subjects'})
    }
})
export default router