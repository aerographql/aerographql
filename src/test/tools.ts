import { MiddlewareDescriptor, createMiddlewareSequence } from '../middleware';
import { Provider, Injector } from '../di';
import { executeAsyncFunctionSequentialy } from '../shared';

export interface ExecuteMiddlewaresArgs {
    source?: any;
    args?: any;
    context?: any
}

export function executeMiddlewares( descs: MiddlewareDescriptor[], args: ExecuteMiddlewaresArgs = {}, additionalProviders: ( Function | Provider )[] = [] ): Promise<any[]> {

    let realArgs = Object.assign( { source: null, args: null, context: null }, args );
    // Build a list of providers needed to run this mw.
    // This include the mw themself plus any additional providers
    let providers = additionalProviders.slice();
    descs.forEach( d => providers.push( d.provider ) );

    let s = createMiddlewareSequence( descs, Injector.resolveAndCreate( providers ) );
    return executeAsyncFunctionSequentialy( s, [ realArgs.source, realArgs.args, realArgs.context ] );
}

export function createInjectable<T=any>( ctr: Function, additionalProviders: ( Function | Provider )[] = [] ): T {

    let providers = additionalProviders.slice();
    providers.push( ctr );

    let i = Injector.resolveAndCreate( providers );

    return i.get( ctr, null );
}

