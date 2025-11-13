import { Router } from "express";
import {
  createUser,
  getUserById,
  updateUser,
  deleteUser,
  listUsers,
  User,
} from "../services/userService";

const router = Router();

/** GET /users?role=&province=&amphoe=&limit=&startAfterId= */
router.get("/", async (req, res, next) =>  {
  try {
    const { role, province, amphoe, limit, startAfterId } = req.query as any;
    const data = await listUsers({
      role,
      province,
      amphoe,
      limit: limit ? Number(limit) : undefined,
      startAfterId,
    });
    res.json(data);
  } catch (e) {
    next(e);
  }
});

/** GET /users/:id */
router.get("/:id", async (req, res, next): Promise<void> => {
  try {
    const user = await getUserById(req.params.id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return; 
    }
    res.json(user);
    return;   
  } catch (e) {
    next(e); 
    return;   
  }
});


/** POST /users */
router.post("/", async (req, res, next) =>  {
  try {
    const payload = req.body as Omit<User, "id" | "createdAt" | "updatedAt">;
    const created = await createUser(payload);
    res.status(201).json(created);
  } catch (e) {
    next(e);
  }
});

/** PATCH /users/:id */
router.patch("/:id", async (req, res, next) => {
  try {
    await updateUser(req.params.id, req.body as Partial<User>);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

/** DELETE /users/:id */
router.delete("/:id", async (req, res, next) => {
  try {
    await deleteUser(req.params.id);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

export default router;
