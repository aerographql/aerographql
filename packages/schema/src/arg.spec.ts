
import { Arg, getArgsMetaObjectMap, ArgsMetaObjectMap} from './arg';
import { ObjectDefinition } from './object-definition';

class TypeImplA {

    fieldA( 
        src: any, 
        @Arg() arg1: number, 
        @Arg() arg2: boolean, 
        @Arg( ) arg3: string, 
        @Arg( { type: 'ID' } ) arg4: string 
    ) {
    }
}

describe( '@Arg decorator', () => {
    let md: ArgsMetaObjectMap;

    beforeEach( () => {
        md = getArgsMetaObjectMap( TypeImplA );
    } )
    it( 'should add args map metadata', () => {
        expect( md ).not.toBeNull();
        expect( md.fieldA ).not.toBeUndefined();
        expect( md ).toHaveProperty( 'fieldA' );
    })

    it( 'should set the correct metadata for number', () => {
        expect( md.fieldA ).toHaveProperty( 'arg1' );
        expect( md.fieldA.arg1.index ).toBe( 1 );
        expect( md.fieldA.arg1.type ).toBe( 'Int' );
        expect( md.fieldA.arg1.nullable ).toBe( false );
    } );

    it( 'should set the correct metadata for boolean', () => {
        expect( md.fieldA ).toHaveProperty( 'arg2' );
        expect( md.fieldA.arg2.index ).toBe( 2 );
        expect( md.fieldA.arg2.type ).toBe( 'Boolean' );
        expect( md.fieldA.arg2.nullable ).toBe( false );
    } );

    it( 'should set the correct metadata for string', () => {
        expect( md.fieldA ).toHaveProperty( 'arg3' );
        expect( md.fieldA.arg3.index ).toBe( 3 );
        expect( md.fieldA.arg3.type ).toBe( 'String' );
        expect( md.fieldA.arg3.nullable ).toBe( false );
    } );
    
    it( 'should set set correct type if overloaded', () => {
        expect( md.fieldA ).toHaveProperty( 'arg4' );
        expect( md.fieldA.arg4.index ).toBe( 4 );
        expect( md.fieldA.arg4.type ).toBe( 'ID' );
        expect( md.fieldA.arg4.nullable ).toBe( false );
    } )
} );
