import jwt from "jsonwebtoken";
import User from "../models/user.js";

// Hàm nhận request (giả sự POST sách -> lấy token của user để check, lấy ở req)
const protectRoute = async (req, res, next) => {

    try {
        const token = req.header("Authorization").replace("Bearer ", "");
        if (!token) { 
            return res.status(401).json({ 
                message: "No authentication token, access denied" 
            }); 
        }

        // verify token, token được nhận từ req => decode lại check token
        const decoded = jwt.verify(token, process.env.JWT_SECRET) ;

        // find user, select các field ngoại trừ password
        const user = await User.findById(decoded.userId).select("-password");
        
        if (!user){
            return res.status(401).json({ 
                message: "Token is not valid" 
            });
        } 

        // Nếu check token ok -> hàm next để chạy code async ở trong bookRoute
        req.user = user; 
        next();
    }
    catch (error) {
        console. error("Authentication error:", error.message) ;
        res. status (401) . json({ message: "Token is not valid" });
    }
};


export default protectRoute;