

export class RuntimeKeeper{
    lastTime:number;
    currentTime:number;
    elapsed:number;
    seconds:number;
    minutes:number;
    hours:number;
    days:number;
    years:number;
    constructor() {
        this.lastTime = 0;
        this.currentTime = 0;
        this.elapsed = 0;
        this.seconds = 0;
        this.minutes = 0;
        this.hours = 0;
        this.days = 0;
        this.years = 0;
    }

    getCurrentUnixSeconds():number{
        return Date.now()/1000;
    }

    resetVals() : void {
        this.lastTime = 0;
        this.currentTime = 0;
        this.elapsed = 0;
        this.seconds = 0;
        this.minutes = 0;
        this.hours = 0;
        this.days = 0;
        this.years = 0;
    }

    start():void {
        this.resetVals();
        this.lastTime = this.getCurrentUnixSeconds();
        this.currentTime = this.getCurrentUnixSeconds();
    }

    update():void {
        this.lastTime=this.currentTime;
        this.currentTime = this.getCurrentUnixSeconds();

        this.elapsed += this.currentTime-this.lastTime;
        //this is mostly ported from some old python code i wrote

        //some flags that explain themselves
        let counting :boolean=true;
        let isLeapYear:boolean=false;
        //self explaitory, how many years worth of seconds we have
        let yearCount :number=0;
        let totalTime:number=this.elapsed;

        //leap year determination algorithm, not the fastest, but im lazy
        while(counting){
            //if we have a year count divisible by 4 with no remainder(a leap year candidate)
            //and if the year count isnt divisible by 100 or is divisible by 400
            //(for some reason, idk man, i looked this shit up)
            if(((yearCount % 4) == 0)&&(((yearCount % 100) != 0) || ((yearCount % 400) === 0))){
                //it is a leap year!
                //record that it is a leap year
                isLeapYear=true;
                //if we have enough seconds to end the year
                if((totalTime - 31622400.0) > 0){
                    //increase the year count
                    yearCount+=1;
                    //subtract the durration of this year from the time we have left
                    totalTime-=31622400.0;
                }else{
                    //otherwise stop looking for more years, we ran out of seconds for there to be another year
                    counting=false;
                }

            }else{
                //if it isnt a leap year
                //record that
                isLeapYear=false

                //if we have enough time to complete the year
                if((totalTime - 31536000.0) > 0){
                    //increase the year count
                    yearCount+=1
                    //subtract the durration of this year from the time we have left
                    totalTime-=31536000.0
                }else{
                    //otherwise stop looking for more years, we ran out of seconds for there to be another year
                    counting=false

                }

            }

        }


        //use this to know when to rollover our days
        let dayDivider:number=365

        //if we ended on a leap year
        if(isLeapYear){
            //change our rollover value to reflect that
            dayDivider=366
        }

        //just a stack of math that is much easier than that monster up there
        this.years=yearCount;
        //calculate the number days we are into the year
        this.days = (Math.floor(totalTime / 86400) % dayDivider)
        //calulate the number of hours we are into the day
        this.hours = (Math.floor(totalTime / 3600) % 24)
        //calculate the number of minutes we are into the hour
        this.minutes = Math.floor((totalTime % 3600) / 60)
        //calulate the number of integer seconds we are into the minute
        this.seconds = (totalTime % 60)

    }

    getTimeString():string{

        return "years: "+this.years + " days: "+ this.days + " hours: "+ this.hours + " minutes: "+ this.minutes + " seconds: "+ this.seconds;
    }



}
