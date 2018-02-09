import { MiddlewareDescriptor, createMiddlewareSequence } from './middleware';
import { Provider, Injector } from './di';
import { executeAsyncFunctionSequentialy } from './shared';


interface MwArgs {
    source?: any;
    args?: any;
    context?: any
}

export let testMiddlewares = ( descs: MiddlewareDescriptor[], args: MwArgs = {}, additionalProviders: ( Function | Provider )[] = null ) => {

    let realArgs = Object.assign( { source: null, args: null, context: null }, args );
    // Build a list of providers needed to run this mw.
    // This include the mw themself plus any additional providers
    let providers: any[] = [];
    if ( additionalProviders )
        providers = additionalProviders.slice();
    descs.forEach( d => providers.push( d.provider ) );

    let s = createMiddlewareSequence( descs, Injector.resolveAndCreate( providers ) );
    return executeAsyncFunctionSequentialy( s, [ realArgs.source, realArgs.args, realArgs.context ] );
}
