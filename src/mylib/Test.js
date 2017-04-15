define(function(){

    class Test{

        constructor(output, error){
            this.output = output || console.log.bind(console);
            this.error = error || console.error.bind(console);
            this.log = this.output;
        }

        areEqual(expect, actual){

        }
    }

    return Test;
});
