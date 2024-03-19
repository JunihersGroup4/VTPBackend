import { Router } from "express"
import { updateProfile, deleteProfile, fetchProfile } from "../controllers/profile.js";
import { authenticateJWT } from "../middlewares/authJWT.js"
import { validateUser } from "../middlewares/validateUser.js";

const ProfileRouter = Router();

ProfileRouter.post(
    "/profile-update",
    authenticateJWT,
    validateUser,
    updateProfile
);
ProfileRouter.put(
    "/delete",
    authenticateJWT,
    validateUser,
    deleteProfile
);

ProfileRouter.get(
    "/profile",
    authenticateJWT,
    validateUser,
    fetchProfile
);

export default ProfileRouter;