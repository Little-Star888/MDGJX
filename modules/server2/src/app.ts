import 'reflect-metadata';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import hpp from 'hpp';
import morgan from 'morgan';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { NODE_ENV, PORT, LOG_FORMAT, ORIGIN, CREDENTIALS } from '@/config';
import moment from 'moment';
import { Routes } from '@/interfaces/routes.interface';
import { ErrorMiddleware } from '@/middlewares/error.middleware';
import migrateDB from './jobs/migrate-db';
import { logger, stream } from '@/utils/logger';
import consumeTln from './jobs/consume-tln';
import dao from './dao';
const launchTime = new Date();
import expressWs from 'express-ws';
import { initWS } from './routes/ws/ws.route';

export interface RouterWs extends express.Router {
  ws(route: string, ...cb): RouterWs;
}

const MAIN_PREFIX = '/v3';

export class App {
  public app: express.Application;
  public env: string;
  public port: string | number;

  constructor(routes: Routes[]) {
    this.app = expressWs(express()).app as express.Application;

    const anyApp = this.app as any;
    initWS(anyApp);

    this.env = NODE_ENV || 'development';
    this.port = 2016;
    (async () => {
      await this.connectToDatabase();
      this.initializeMiddlewares();
      this.initializeRoutes(routes);
      this.initializeErrorHandling();

      migrateDB();
      consumeTln();
    })();
  }

  public listen() {
    this.app.listen(this.port, () => {
      logger.info(`=================================`);
      logger.info(`======= ENV: ${this.env} =======`);
      logger.info(`🚀 App listening on the port ${this.port}`);
      logger.info(`=================================`);
    });
  }

  public getServer() {
    return this.app;
  }

  private async connectToDatabase() {
    await dao();
  }

  private initializeMiddlewares() {
    this.app.use(morgan(LOG_FORMAT, { stream }));
    this.app.use(cors({ origin: ORIGIN, credentials: CREDENTIALS }));
    this.app.use(hpp());
    this.app.use(helmet());
    this.app.use(compression());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(cookieParser());
  }

  private initializeRoutes(routes: Routes[]) {
    routes.forEach(route => {
      this.app.use(MAIN_PREFIX, route.router);
    });
    this.app.use('/', (req, res) => {
      if (req.url == '/') {
        res.send({
          version: process.env.APP_VERSION || 'UnknownVersion',
          launchAt: launchTime,
          launchFromNow: moment(launchTime).fromNow(),
        });
      } else {
        req.next();
      }
    });
  }

  private initializeErrorHandling() {
    this.app.use(ErrorMiddleware);
  }
}
