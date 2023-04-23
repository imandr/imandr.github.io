class BitStream
{
    constructor(data, n)
    {
        if( data == null )
        {
            this.Buffer = [];
            this.N = 0;
            return;
        }

        if(Number.isInteger(data))
            data = [data];
        
        
        if( typeof data === 'string' || data instanceof String )
        {
            var bytes = [];
            for( let ic = 0; ic < data.length; ic++)
                bytes.push(data.charCodeAt(ic));
            const tmp = BitStream.from_bytes(bytes);
            this.Buffer = tmp.Buffer;
            this.N = data.length * 8;
        }
        else if( Array.isArray(data) || data instanceof Uint32Array || data instanceof Int32Array )
        {
            if( n == null )
                n = data.length * 32;
            if( data.length * 32 < n )
                throw("Input data is too short. Expected " + Math.floor((n+31)/32) + " 32 bit words");
            this.Buffer = Array.isArray(data) ? data.slice() : Array.from(data.values());
            this.N = n;
            this.truncate();
        }
        else
        {
            // assume integer byte
            if( n == null )
                n = 0;
            const word = (data & 255) * 0x01010101;
            this.Buffer = [];
            const nwords = Math.floor((n+31)/32);
            for( let i = 0; i < nwords; i++ )
                this.Buffer.push(words);
            this.N = n;
        }
    }
    
    static from_bytes(bytes)
    {
        var words = [];
        for( let ic = 0; ic < bytes.length; )
        {
            var w = 0;
            for( let j = 0; j < 4 && ic < bytes.length; j++, ic++)
                w |= bytes[ic] << (24-j*8);
            words.push(w);
        }
        return new BitStream(words, bytes.length*8);
    }
    
    as_bytes()
    {
        var out = [];
        var n = this.N;
        for( let i = 0; i < this.Buffer.length; i++ )
            for( let j = 0; j < 4 && n > 0; j++, n-=8 )
                out.push((this.Buffer[i] >> (24-j*8)) & 255);
        return out;
    }
    
    as_string()
    {
        if( this.N % 8 != 0 )
            throw "Bitsream size is not a multiple of 8";
        const bytes = this.as_bytes();
        var out = "";
        for( let byte of bytes )
            out += String.fromCharCode(byte);
        return out;
    }
    
    as_hex()
    {
        if( this.N % 8 != 0 )
            throw "Bitsream size is not a multiple of 8";
        const bytes = this.as_bytes();
        var out = "";
        for( let byte of bytes )
            out += ((byte < 16) ? 0 : '') + byte.toString(16);
        return out;        
    }

    as_int()
    {
        if( this.N > 32 )
            throw "Bitsream is longer than 32 bit";
        return this.Buffer[0] >>> (32 - this.N);
    }

    peek(nbits)
    {   // return upper nbits bits as a new BitStream object without modifying this
        if( nbits == null || nbits <= 0 || nbits > this.N )
            nbits = this.N
        const nwords = Math.floor((nbits + 31)/32);
        return new BitStream(this.Buffer.slice(0, nwords), nbits);
    }
    
    pull(n)
    {   // remove and discard upper nbits bits, in place
        if( n == null )
            n = this.N;
        if( n > this.N )
            n = this.N;
        var nwords = Math.floor(n/32);
        const nbits = n % 32;
        var head = [];
        if( nwords > 0 )
        {
            head = this.Buffer.slice(0, nwords);
            this.Buffer = this.Buffer.slice(nwords);
            this.N -= nwords * 32;
        }
        if( nbits > 0 )
        {
            // shift all the words by extra_bits
            const shift = 32 - nbits;
            var carry = 0;
            for( let i = this.Buffer.length - 1; i >= 0; i-- )
            {
                const upper = this.Buffer[i] >>> shift;
                this.Buffer[i] = (this.Buffer[i] << nbits) + carry;
                carry = upper;
            }
            this.N -= nbits;
            head.push(carry << shift);
        }
        this.truncate();
        return new BitStream(head, n);
    }
    
    truncate(n)
    {
        // if n >= 0 truncates the tail to leave room for n bits only
        // else (n < 0) truncates last n bits
        if( n == null )
            n = this.N;
        else if( n < 0 )
            n = this.N < -n ? 0 : this.N + n;
        this.N = n;
        const needed = Math.floor((this.N + 31)/32);
        if( needed < this.Buffer.length )
            this.Buffer = this.Buffer.slice(0, needed);
        return this;
    }
    
    push(source, n)
    {   // source can be either int or array of 32bit ints, or another BitStrem object
        
        if(Number.isInteger(source))
            source = [source];

        if( Array.isArray(source) )
            source = new BitStream(source, n);
        else
        {
            source = source.peek();     // make a copy
            n = source.N;
        }
        
        this.truncate();
        
        var free_bits = this.Buffer.length * 32 - this.N;       // this can not be >= 32 after the truncation
        if( free_bits > 0 )
        {
            const ntocopy = free_bits > n ? n : free_bits;
            const mask = (1<<ntocopy) - 1;
            const head = source.pull(ntocopy).as_int();
            this.Buffer[this.Buffer.length - 1] |= head << (free_bits - ntocopy);
        }
        if( source.Buffer.length )
            this.Buffer = this.Buffer.concat(source.Buffer);
        this.N += n;
        return this;
    }
}