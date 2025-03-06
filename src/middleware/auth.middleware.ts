import { Request, Response, NextFunction } from "express";

// Make sure the middleware has the correct signature
export const apiKeyAuth = (req: Request, res: Response, next: NextFunction) => {
  // Skip auth for development environment if configured
  if (
    process.env.NODE_ENV !== "production" &&
    process.env.SKIP_API_AUTH === "true"
  ) {
    return next();
  }

  const apiKey = req.headers["x-api-key"];

  // In production, you'd use a more secure approach like JWT tokens
  // For simplicity, we're using a simple API key here
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  next();
};

// This middleware can be used to protect routes that should only be accessible
// to dashboard users who are authenticated
export const dashboardAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // In a real implementation, you would check for a valid JWT token
  // from your frontend authentication system

  // Placeholder for demonstration purposes
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // In production, you would verify the token
  // const token = authHeader.split(' ')[1];
  // try {
  //   const decoded = jwt.verify(token, process.env.JWT_SECRET);
  //   req.user = decoded;
  // } catch (error) {
  //   return res.status(401).json({ error: 'Invalid token' });
  // }

  next();
};
