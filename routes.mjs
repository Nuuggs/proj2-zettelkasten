import userAuth from "./middleware/auth.js";
import landingRouter from "./routers/landingRouter.js";
import signupRouter from "./routers/signupRouter.js";
import loginRouter from "./routers/loginRouter.js";
import logoutRouter from "./routers/logoutRouter.js";
import dashboardRouter from "./routers/dashboardRouter.js";
import noteRouter from "./routers/noteRouter.js";
import tagRouter from "./routers/tagRouter.js";

export default function bindRoutes(app) {
  
  app.use(userAuth);
  app.use('/', landingRouter);
  app.use('/signup', signupRouter);
  app.use('/login', loginRouter);
  app.use('/dashboard', dashboardRouter);
  app.use('/logout', logoutRouter);
  app.use('/note', noteRouter);
  app.use('/tags', tagRouter);
  
};