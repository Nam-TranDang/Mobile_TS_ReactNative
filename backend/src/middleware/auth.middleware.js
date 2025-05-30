// src/middleware/auth.middleware.js
import jwt from "jsonwebtoken";
import User from "../models/user.js"; 

const protectRoute = async (req, res, next) => {
    try {
        const authHeader = req.header("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "No authentication token, access denied. Token must be Bearer token."
            });
        }
        const token = authHeader.replace("Bearer ", "");
        

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
       
        const user = await User.findById(decoded.userId).select("-password"); 

        if (!user) {
            return res.status(401).json({ message: "Token is not valid, user not found." });
        }

        if (user.isSuspended && user.suspensionEndDate && user.suspensionEndDate <= new Date()) {
            await user.checkAndLiftSuspension(); 
        }
        
        if (user.isSuspended) {
            
            if (user.suspensionEndDate && user.suspensionEndDate > new Date()) {
                return res.status(403).json({
                    message: "Forbidden: Your account is currently suspended.",
                    reason: user.suspensionReason,
                    suspensionEndDate: user.suspensionEndDate.toISOString(),
                });
            } else if (user.suspensionEndDate && user.suspensionEndDate <= new Date()) {
               
                await user.checkAndLiftSuspension();
                if (user.isSuspended) { 
                     return res.status(403).json({
                        message: "Forbidden: Account suspension status unclear. Please contact support.",
                    });
                }
                
            } else { 
                 return res.status(403).json({
                    message: "Forbidden: Your account is suspended indefinitely. Please contact support.",
                    reason: user.suspensionReason,
                });
            }
        }
       

        req.user = user;
        next();
    } catch (error) {
        console.error("Authentication error in protectRoute:", error.message);
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: "Token is not valid or has expired." });
        }
        res.status(500).json({ message: "Internal server error during authentication." });
    }
};

export default protectRoute;