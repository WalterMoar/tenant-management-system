import { Request, Response, NextFunction } from 'express';
import { TMSRepository } from '../repositories/tms.repository';
import { connection } from './db.connection';
import { ForbiddenError } from '../errors/ForbiddenError';
import logger from './logger';
import { ErrorHandler } from './error.handler';

const errorHandler:ErrorHandler = new ErrorHandler();

export const checkTenantAccess = (requiredRoles?: string[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const tenantId:string = req.params.tenantId;
            const tmsRepository:TMSRepository = new TMSRepository(connection.manager);

            if (req.isSharedServiceAccess) {
                const clientIdentifier:string = req.decodedJwt?.aud
                if (!tenantId || !clientIdentifier) {
                    throw new ForbiddenError('Missing tenant ID or client identifier');
                }

                const hasServiceAccess:boolean = await tmsRepository.checkIfTenantHasSharedServiceAccess(tenantId, clientIdentifier)
                if (!hasServiceAccess) {
                    throw new ForbiddenError('Shared service not authorized for this tenant')
                }
            }

            const ssoUserId:string = req.decodedJwt?.idir_user_guid;
            if (!tenantId || !ssoUserId) {
                throw new ForbiddenError('Missing tenant ID or user ID');
            }

            const hasAccess:boolean = await tmsRepository.checkUserTenantAccess(tenantId, ssoUserId, requiredRoles)
            if (!hasAccess) {
                throw new ForbiddenError(`Access denied: User does not have required roles for tenant: ${tenantId}`);
            }

            next();
        } catch (error) {
            logger.error('Tenant access check failed:', error);
            if (error instanceof ForbiddenError) {
                errorHandler.generalError(res,"Authorization Failure", error.message, error.statusCode, "Forbidden")
            } else {
                next(error);
            }
        }
    };
}; 