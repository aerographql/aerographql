import 'reflect-metadata';
import { META_KEY_METAOBJECT_TYPE, METAOBJECT_TYPES } from 'aerographql-core';

import { Context } from './shared';

/**
 * Middleware decorator
 */
export function Middleware() {
    return function ( ctr: Function ) {

        Reflect.defineMetadata( META_KEY_METAOBJECT_TYPE, METAOBJECT_TYPES.middleware, ctr );
    }
}

export type MiddlewareSignature = ( ...args: any[] ) => Promise<any>;

export interface BaseMiddleware {
    execute( src: any, args: any, context: Context  ): Promise<any>;
}

export class MiddlewareError {
    constructor( public middleware: string, public reason: string ) {
    }

    toString() {
        return `Middleware  "${this.middleware}" error with reason "${this.reason}"`;
    }
}
