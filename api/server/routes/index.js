import config from '../config.js';
import { expressjwt } from 'express-jwt';
import glob from 'glob';
import path from 'path';
import { getAuthUser, decodeToken } from '../utils/jwt.helper.js';
import { fileURLToPath } from 'url';
import httpStatus from 'http-status';
const __filename = fileURLToPath(import.meta.url);
const basename = path.basename(__filename);

export default async (app) => {
  console.log('Setting up routes.', config.jwtSecret);
  console.log('JWT Secret Value:', config.jwtSecret ? config.jwtSecret.substring(0, 10) + '...' : 'NOT SET');

  // https://jwt.io/introduction/

  app.use(
    '/api/v1',
    (req, res, next) => {
      console.log("processing protected routes");
      console.log(config.jwtSecret);
      //  console.log(req);
      next();
    },
    
    expressjwt({
      secret: config.jwtSecret,
      algorithms: ['HS256'],
      isRevoked: getAuthUser
    }).unless({
      path: [
        '/api/v1/user/signup',
        '/api/v1/user/Otp',
        '/api/v1/user/send-otp',
        '/api/v1/user/login',
        '/api/v1/dashboard/professionals/search',
        
        // '/api/v1/user/update-user',

        //dashboard
        '/api/v1/dashboard/categories',
        '/api/v1/dashboard/services',
        '/api/v1/dashboard/facilities',
        '/api/v1/dashboard/establishment-types',
        '/api/v1/dashboard/banners',
        '/api/v1/dashboard/hospitals',
        '/api/v1/dashboard/pharmacy-list',
        '/api/v1/dashboard/category-establishment-search',
        '/api/v1/dashboard/category-establishment-search-new',
        '/api/v1/dashboard/category-profession-search',
        '/api/v1/dashboard/professions-detail',
        '/api/v1/dashboard/establishment-detail',
        // '/api/v1/dashboard/insurances-list',
        // '/api/v1/dashboard/add-insurance-enquiry',
        '/api/v1/dashboard/health-test-list',
        '/api/v1/dashboard/health-test-detail',
        '/api/v1/dashboard/add-health-test-booking',
        '/api/v1/dashboard/add-service-booking',
        '/api/v1/user/send-otp-on-email',
        '/api/v1/user/verify-forgot-password-otp',
        '/api/v1/user/reset-password',
        '/api/v1/dashboard/search',
        '/api/v1/dashboard/search-result-details',
        '/api/v1/dashboard/sync-search-data',
        '/api/v1/user/send-otp-whatsapp',
        '/api/v1/user/verify-otp-whatsapp',
        '/api/v1/user/request-mobile-update-otp',
        '/api/v1/user/verify-mobile-update-otp',
        '/api/v1/dashboard/popular-searches',
        '/api/v1/dashboard/specialties-for-clinics',
        '/api/v1/dashboard/demo-login',
        '/api/v1/dashboard/faqs',
        '/api/v1/notificationRoutes/notifications/token',
        '/api/v1/notificationRoutes/notifications/test',
        '/api/v1/dashboard/professionals-details',
        '/api/v1/dashboard/establishment-details',
        '/api/v1/dashboard/categories',
        '/api/v1/dashboard/brands',
        '/api/v1/dashboard/products',
        '/api/v1/dashboard/pharmacies',
        '/api/v1/user/packages',
        '/api/v1/user/package-categories',
        '/api/v1/user/insurance-plans',
        '/api/v1/user/insurance-specialities',
        '/api/v1/user/webhook',
        /^\/api\/v1\/user\/packages\/[0-9A-Za-z]+$/
      ]
    })
  );
  // index.js
  // app.use(
  //   '/api/v1',
  //   expressjwt({
  //     secret: config.jwtSecret,
  //     algorithms: ['HS256'],
  //     isRevoked: getAuthUser,
  //   }).unless({
  //     path: [
  //       // ... existing paths ...
  //       '/api/v1/dashboard/search',
  //     ],
  //   })
  // );
  app.use(async (req, res, next) => {
    try {
      let userData;
      if (req.headers.authorization) {
        userData = decodeToken(req.headers.authorization);
      }
      console.log('userdata decode : ', userData);
      console.log(next);
      next();
    } catch (error) {
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json(
          new APIResponse(
            response,
            ENUM.COMMON.AUTHENTICATION_ERROR,
            httpStatus.INTERNAL_SERVER_ERROR
          )
        );
    }
  });

  // const apiLimiter = rateLimit({
  //   windowMs: 60 * 60 * 1000 * 20, // 15 minutes
  //   max: 2000000,
  //   message: "You have exceeded the 100 requests in 24 hrs limit!",
  //   headers: true,
  // });

  async function mountRoutes() {
    
    try {
      const files = glob.sync('api/server/routes/*.js');
      console.log('Found route files:', files);
      files
        .filter((file) => file.split('/').reverse()[0] !== basename)
        .forEach(async (routeFilename) => {
          const routeName = path.basename(routeFilename, '.js');
          try {
            console.log(`Attempting to load ${routeName}`);
            const routes = await import(`./${routeName}.js`);
            console.log(`Mounted /api/v1/${routeName}`);
            app.use(`/api/v1/${routeName}`, routes.default);
          } catch (error) {
            console.error(`Failed to load ${routeName}:`, error);
          }
        });
    } catch (error) {
      console.error('mountRoutes error:', error);
    }
  }

  await mountRoutes();

  // app.use('/api/v1/user', user);
  return app;
};