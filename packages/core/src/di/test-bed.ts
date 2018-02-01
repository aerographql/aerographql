import { Injector, Provider } from './injector';

export interface TestBedConfig {
    providers?: ( Function | Provider )[]
}
let injector: Injector;

/**
 * Configures and initializes environment for unit testing and provides methods for creating services in unit tests.
 */
export class TestBed {
    static configure( config: TestBedConfig ): Injector {
        let providers: ( Function | Provider )[] = [];
        if ( config.providers )
            providers = config.providers;
        injector = Injector.resolveAndCreate( providers );
        return injector;
    }
}


export let inject = ( providers: ( Function | string )[], cb: ( ...injectables: any[] ) => void ) => {

    return ( done: any ) => {

        if ( !injector ) {
            throw new Error( 'Please call TestBed.provide() beforehand' );
        }

        let tokens = providers.map( p => {
            if ( typeof p === 'function' )
                return p.name;

            return p;
        } );

        let injectables = tokens.map( token => injector.get( token ) );

        cb( ...injectables );

        done();
    };
}
