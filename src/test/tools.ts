import { MiddlewareDescriptor, createMiddlewareSequence } from '../middleware';
import { Provider, Injector } from '../di';
import { executeAsyncFunctionSequentialy } from '../shared';

export namespace TestTools {

    export interface MwArgs {
        source?: any;
        args?: any;
        context?: any
    }

    export let executeMiddlewares = ( descs: MiddlewareDescriptor[], args: MwArgs = {}, additionalProviders: ( Function | Provider )[] = [] ) => {

        let realArgs = Object.assign( { source: null, args: null, context: null }, args );
        // Build a list of providers needed to run this mw.
        // This include the mw themself plus any additional providers
        let providers = additionalProviders.slice();
        descs.forEach( d => providers.push( d.provider ) );

        let s = createMiddlewareSequence( descs, Injector.resolveAndCreate( providers ) );
        return executeAsyncFunctionSequentialy( s, [ realArgs.source, realArgs.args, realArgs.context ] );
    }

    export let createInjectable = ( ctr: Function, additionalProviders: ( Function | Provider )[] = [] ) => {

        let providers = additionalProviders.slice();
        providers.push( ctr );

        let i = Injector.resolveAndCreate(providers);

        return i.get( ctr, null );
    }

}

