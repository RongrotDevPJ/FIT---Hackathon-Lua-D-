import { Router, Request, Response } from "express";
import {
  // ลบ createUser ออก เพราะไม่ได้ใช้แล้ว
  getUserById,
  updateUser,
  deleteUser,
  listUsers,
  User,
} from "../services/userService";
import { db } from "../config/firestore";


const router = Router();

// POST /login  -> ล็อกอิน
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { phone, password } = req.body ?? {};

    if (!phone || !password) {
      return res.status(400).json({ error: "missing_fields" });
    }

    const snap = await db
      .collection("users")
      .where("phone", "==", String(phone))
      .limit(1)
      .get();

    if (snap.empty) {
      return res.status(401).json({ error: "invalid_credentials" });
    }

    const doc = snap.docs[0];
    const data = doc.data() as any;

    if (!data.password || data.password !== String(password)) {
      return res.status(401).json({ error: "invalid_credentials" });
    }

    // DEV: token ปลอม ๆ ให้ frontend เก็บ
    const fakeToken = `dev-token-${doc.id}`;

    return res.json({
      user: {
        id: doc.id,
        name: data.name,
        phone: data.phone,
        role: data.role,
        province: data.province,
        amphoe: data.amphoe,
      },
      token: fakeToken,
    });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: e.message ?? "internal_error" });
  }
});

// POST /users  -> สมัคร (Frontend เรียกใช้ Endpoint นี้)
router.post("/users", async (req: Request, res: Response) => {
  try {
    const { name, phone, role, province, amphoe, password } = req.body ?? {};

    if (!name || !phone || !role || !password) {
      return res.status(400).json({ error: "missing_fields" });
    }

    // เช็กเบอร์ซ้ำ
    const dupSnap = await db
      .collection("users")
      .where("phone", "==", String(phone))
      .limit(1)
      .get();

    if (!dupSnap.empty) {
      return res.status(400).json({ error: "phone_already_used" });
    }

    const now = new Date();

    const docData = {
      name: String(name),
      phone: String(phone),
      role: String(role),       // "farmer" | "buyer"
      province: province ? String(province) : null,
      amphoe: amphoe ? String(amphoe) : null,
      password: String(password), // ⚠ DEV ONLY – ไม่ปลอดภัยสำหรับ production
      createdAt: now,
      updatedAt: now,
    };

    const ref = await db.collection("users").add(docData);

    return res.status(201).json({
      id: ref.id,
      ...docData,
      password: undefined, // ไม่ต้องส่งกลับให้ frontend
    });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: e.message ?? "internal_error" });
  }
});

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