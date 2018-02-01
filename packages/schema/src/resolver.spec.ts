
import { getMetaObject } from 'aerographql-core';

import { ObjectImplementation, ObjectImplementationMetaObject } from './object-implementation';
import { Resolver } from './resolver';
import { Arg } from './arg';
import { ObjectDefinition } from './object-definition';

@ObjectDefinition( {
    name: 'TypeA'
} )
class TypeA { }

@ObjectImplementation( {
    name: 'TypeA'
} )
class TypeImplA { }

@ObjectImplementation( {
    name: 'TypeA'
} )
class TypeImplB {

    @Resolver( { type: 'TypeA', description: 'Desc' } )
    fieldA( src: any, @Arg() arg1: number ) {
    }
}

class UnanotatedType {

}

@ObjectImplementation( {
    name: 'TypeA'
} )
class TypeImplC {

    @Resolver( { type: TypeA } )
    fieldA( src: any, @Arg() arg1: number ) {
    }


    @Resolver( { type: TypeA, list: true } )
    fieldB( src: any, @Arg() arg1: number ) {
    }

}

describe( '@Resolver decorator', () => {
    it( 'should correctly set description', () => {
        expect( getMetaObject( TypeImplB ) ).not.toBeNull();

        let md = getMetaObject<ObjectImplementationMetaObject>( TypeImplB );
        expect( md.fields ).toHaveProperty( 'fieldA' );
        expect( md.fields.fieldA.description ).toBe('Desc');


        md = getMetaObject<ObjectImplementationMetaObject>( TypeImplC );
        expect( md.fields ).toHaveProperty( 'fieldA' );
        expect( md.fields.fieldA.description ).toBeNull();
    })
    
    it( 'should set the correct metadata when using weakly typed type info', () => {
        expect( getMetaObject( TypeImplB ) ).not.toBeNull();

        let md = getMetaObject<ObjectImplementationMetaObject>( TypeImplB );
        expect( md.name ).toBe( 'TypeA' );
        expect( md.fields ).toHaveProperty( 'fieldA' );
        expect( md.fields.fieldA.type ).toBe( 'TypeA' );
        expect( md.fields.fieldA.list ).toBe( false );
        expect( md.fields.fieldA.nullable ).toBe( false );
        expect( md.fields.fieldA.instanceToken ).toBe( 'TypeImplB' );

    } );
    it( 'should set the correct metadata when using strongly typed type info', () => {
        expect( getMetaObject( TypeImplC ) ).not.toBeNull();

        let md = getMetaObject<ObjectImplementationMetaObject>( TypeImplC );
        expect( md.name ).toBe( 'TypeA' );
        expect( md.fields ).toHaveProperty( 'fieldA' );
        expect( md.fields.fieldA.type ).toBe( 'TypeA' );
        expect( md.fields.fieldA.list ).toBe( false );
        expect( md.fields.fieldA.nullable ).toBe( false );
        expect( md.fields.fieldA.instanceToken ).toBe( 'TypeImplC' );
    } );
    
    it( 'should correctly determine if returning list', () => {
        expect( getMetaObject( TypeImplC ) ).not.toBeNull();

        let md = getMetaObject<ObjectImplementationMetaObject>( TypeImplC );
        expect( md.name ).toBe( 'TypeA' );
        expect( md.fields ).toHaveProperty( 'fieldB' );
        expect( md.fields.fieldB.type ).toBe( 'TypeA' );
        expect( md.fields.fieldB.list ).toBe( true );
        expect( md.fields.fieldB.instanceToken ).toBe( 'TypeImplC' );
    } );
    
    it( 'should throw in invalid configuration', () => {
        expect( () => {
            @ObjectImplementation( { name: 'TypeA' } )
            class Type {
            
                @Resolver( { type: UnanotatedType } )
                field() {}
            }
        } ).toThrowError();
    })
} );

describe( '@Arg decorator', () => {
    it( 'should set the correct metadata', () => {
        expect( getMetaObject( TypeImplB ) ).not.toBeNull();

        let md = getMetaObject<ObjectImplementationMetaObject>( TypeImplB );
        expect( md.fields.fieldA.args ).toHaveProperty( 'arg1' );
        expect( md.fields.fieldA.args.arg1.index ).toBe( 1 );
        expect( md.fields.fieldA.args.arg1.nullable ).toBe( false );
        expect( md.fields.fieldA.args.arg1.type ).toBe( 'Int' );
    } );
} );
