import "reflect-metadata";
import { META_KEY_DESIGN_PARAMSTYPES, META_KEY_TOKEN } from '../shared'
import { Injectable } from './decorators';

/**
 * Allow to provide a dependencies with an explicit token.
 */
export interface Provider {
    token: string;
    factory?: Function;
    value?: any;
}

/**
 * This is where every injectable dependencies are registered.
 *
 * Provide tools to resolve every dependencies on a given function
 */
@Injectable()
export class Injector {

    private injectables: Map<string, Provider> = new Map<string, Provider>();
    private instances: Map<string, any> = new Map<string, any>();

    constructor() {
    }

    /**
     * Return an already instanciated injectable and instanciate it if necessary
     * @param token The token for the given dependency
     */
    get<T = any>( token: string | Function, notFoundValue?: T ): T {

        // Grab the provider from the internal db
        let tokenName = '';
        if ( typeof token === 'string' )
            tokenName = token;
        else
            tokenName = token.name;

        let p = this.injectables.get( tokenName );

        if ( !p ) {
            if ( notFoundValue === undefined )
                throw new Error( `There is no registerd injectable for token "${token}" (and no "notFoundValue" was passed)` );
            else
                return notFoundValue;
        }

        // If it's a factory
        if ( p.factory !== undefined ) {
            // Grab instance of each dependencies for this provider
            let dependenciesTokens = this.getDependenciesTokens( p.factory );
            let dependencies;
            try {
                dependencies = dependenciesTokens.map( token => {
                    let dependency = this.get( token );
                    return dependency;
                } );
            } catch ( e ) {
                throw new Error( p.factory.name + ' -> ' + e.message );
            }

            // Create a new instance if this wasn't done yet.
            if ( !this.instances.has( tokenName ) ) {
                let i = new ( p.factory as any )( ...dependencies );
                this.instances.set( tokenName, i );
            }

            // Return the already created instance 
            return this.instances.get( tokenName );
        } else if ( p.value !== undefined ) {
            return p.value;
        }

        throw new Error( 'Invalid provider configuration' );
    }

    /**
     * Return a list of token matching each dependencies needed for this constructor
     * @param ctr
     */
    private getDependenciesTokens( ctr: Function ) {
        let paramtypes: any[] = Reflect.getMetadata( META_KEY_DESIGN_PARAMSTYPES, ctr );
        if ( !paramtypes ) {
            paramtypes = [];
        }

        return paramtypes.map( ( p: any, index ) => {

            let explicitToken = Reflect.getMetadata( META_KEY_TOKEN + index, ctr );
            if ( explicitToken )
                return explicitToken;

            return p.name;
        } );
    }

    /**
     * Create a brand new injector
     * @param providers List of providers registered in the new injector
     */
    static resolveAndCreate( providers: ( Function | Provider )[] ) {
        let injector = new Injector();

        // self register the Injector
        injector.registerProvider( this );

        providers.forEach( p => {
            injector.registerProvider( p );
        } );

        return injector;
    }

    /**
     * Register a provider in this injector.
     * Each provider will be associated with an unique token.
     *
     * A provider will provide an instance of the described dependency.
     * Providers can be of two types:
     *  - A class constructor:
     *    In this case the constructor will be used to create the effective instance of the dependency,
     *    And the class name will be used as the token
     *  - A provider object:
     *    In this case both token and class constructor are stored separetly in the provider object
     *
     * @param provider
     */
    private registerProvider( provider: ( Function | Provider ) ) {
        let token: string;
        let factory: Function;
        let value: any;

        if ( !provider )
            return;

        if ( typeof provider === "function" ) {
            token = provider.name;
            if ( !token ) {
                throw new Error( 'Injectable does not have metadata' );
            }
            factory = provider;
            value = null
        } else {
            if ( !provider.token )
                throw new Error( 'Invalid provider, undefined token' )

            if ( !provider.factory && !provider.value )
                throw new Error( 'Invalid provider, neither factory of value was provided' )

            token = provider.token;
            factory = provider.factory;
            value = provider.value;
        }

        if ( this.injectables.has( token ) )
            throw new Error( `Invalid provider token "${token}" already exist` );

        this.injectables.set( token, { token, factory, value } );

    }
}
