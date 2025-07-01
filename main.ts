//% color=#8b00ff icon="\uf2db" block="Staar-Bot"
namespace dCode {
    //% group="Car Control"
    //% blockId=car_control block="Move car %direction speed %speed"
    //% speed.min=0 speed.max=100
    export function carMove(direction: CarDirection, speed: number): void {
        let pwmValue = Math.map(speed, 0, 100, 0, 1023);


        switch (direction) {
            case CarDirection.Forward:
                pins.analogWritePin(AnalogPin.P13, pwmValue);
                pins.analogWritePin(AnalogPin.P14, 0);
                pins.analogWritePin(AnalogPin.P15, pwmValue);
                pins.analogWritePin(AnalogPin.P16, 0);
                break;
            case CarDirection.Backward:
                pins.analogWritePin(AnalogPin.P13, 0);
                pins.analogWritePin(AnalogPin.P14, pwmValue);
                pins.analogWritePin(AnalogPin.P15, 0);
                pins.analogWritePin(AnalogPin.P16, pwmValue);
                break;
            case CarDirection.Left:
                pins.analogWritePin(AnalogPin.P13, 0);
                pins.analogWritePin(AnalogPin.P14, pwmValue);
                pins.analogWritePin(AnalogPin.P15, pwmValue);
                pins.analogWritePin(AnalogPin.P16, 0);
                break;
            case CarDirection.Right:
                pins.analogWritePin(AnalogPin.P13, pwmValue);
                pins.analogWritePin(AnalogPin.P14, 0);
                pins.analogWritePin(AnalogPin.P15, 0);
                pins.analogWritePin(AnalogPin.P16, pwmValue);
                break;
            case CarDirection.Stop:
                pins.analogWritePin(AnalogPin.P13, 0);
                pins.analogWritePin(AnalogPin.P14, 0);
                pins.analogWritePin(AnalogPin.P15, 0);
                pins.analogWritePin(AnalogPin.P16, 0);
                break;
        }
    }


    //% blockId=car_direction block="%direction"
    //% blockHidden=true
    export enum CarDirection {
        //% block="Forward"
        Forward = 0,
        //% block="Backward"
        Backward = 1,
        //% block="Left"
        Left = 2,
        //% block="Right"
        Right = 3,
        //% block="Stop"
        Stop = 4
    }




    //% group="Sensors"
    //% blockId=digital_sensor block="read Digital sensor at pin %pin"
    //% pin.defl=DigitalPin.P1
    export function readDigitalSensor(pin: DigitalPin): number {
        pins.setPull(pin, PinPullMode.PullUp); // Enable internal pull-up resistor
        return pins.digitalReadPin(pin);
    }



    //% group="Sensors"
    //% blockId=analog_sensor block="read Analog sensor at pin %pin"
    //% pin.defl=AnalogPin.P0
    export function readAnalogSensor(pin: AnalogPin): number {
        return pins.analogReadPin(pin);
    }


    //% group="Sensors"
    //% blockId=dht11_sensor block="read DHT11 %dhtData at pin %pin"
    //% pin.defl=DigitalPin.P2
    export function readDHT11(dhtData: DHT11Data, pin: DigitalPin): number {
        let buffer: number[] = [];
        let startTime: number;
        let signal: number;


        // Start signal
        pins.digitalWritePin(pin, 0);
        basic.pause(18);
        pins.digitalWritePin(pin, 1);
        control.waitMicros(40);
        pins.setPull(pin, PinPullMode.PullUp);


        // Wait for response
        while (pins.digitalReadPin(pin) == 1);
        while (pins.digitalReadPin(pin) == 0);
        while (pins.digitalReadPin(pin) == 1);


        // Read 40-bit data (5 bytes)
        for (let i = 0; i < 40; i++) {
            while (pins.digitalReadPin(pin) == 0);
            startTime = control.micros();
            while (pins.digitalReadPin(pin) == 1);
            signal = control.micros() - startTime;
            buffer.push(signal > 40 ? 1 : 0);
        }


        // Convert data
        let humidity = (buffer.slice(0, 8).reduce((a, b) => (a << 1) | b, 0));
        let temperature = (buffer.slice(16, 24).reduce((a, b) => (a << 1) | b, 0));


        return dhtData == DHT11Data.Temperature ? temperature : humidity;
    }


    //% blockId=dht11_data block="%dhtData"
    //% blockHidden=true
    export enum DHT11Data {
        //% block="Temperature (°C)"
        Temperature = 0,
        //% block="Humidity (%)"
        Humidity = 1
    }




    //% group="Sensors"
    /**
    * Measure distance using an ultrasonic sensor.
    * @return Distance in centimeters
    */

    //% block="turn $led LED $state"
    //% state.shadow="toggleOnOff"
    //% blockGap=8
    export function controlLED(led: LedColor, state: boolean): void {
        let pin: DigitalPin;
        if (led == LedColor.Red) {
            pin = DigitalPin.P8;
        } else if (led == LedColor.Yellow) {
            pin = DigitalPin.P2;
        } else {
            pin = DigitalPin.P0;
        }
        pins.digitalWritePin(pin, state ? 1 : 0);
    }

    //% block="turn all LEDs $state"
    //% state.shadow="toggleOnOff"
    //% blockGap=8
    export function controlAll(state: boolean): void {
        pins.digitalWritePin(DigitalPin.P0, state ? 1 : 0); // Red
        pins.digitalWritePin(DigitalPin.P2, state ? 1 : 0); // Yellow
        pins.digitalWritePin(DigitalPin.P8, state ? 1 : 0); // Green
    }

    export enum LedColor {
        //% block="Red"
        Red,
        //% block="Yellow"
        Yellow,
        //% block="Green"
        Green
    }


    /**
 * Measure distance using ultrasonic sensor based on selected pin
 * If selected pin is:
 * - P0 → Trigger: P0, Echo: P1
 * - P1 → Trigger: P1, Echo: P2
 * - P2 → Trigger: P2, Echo: P0, and set P8 HIGH
 * @param selPin pin to select configuration
 * @returns distance in centimeters
 */
    //% block="distance using pin $selPin"
    //% selPin.shadow="pin"
    export function readDistanceByPin(selPin: DigitalPin): number {
        let trig: DigitalPin;
        let echo: DigitalPin;

        if (selPin == DigitalPin.P0) {
            trig = DigitalPin.P0;
            echo = DigitalPin.P1;
        } else if (selPin == DigitalPin.P1) {
            trig = DigitalPin.P1;
            echo = DigitalPin.P2;
        } else if (selPin == DigitalPin.P2) {
            trig = DigitalPin.P2;
            echo = DigitalPin.P0;
            pins.digitalWritePin(DigitalPin.P8, 1); // Set P8 HIGH
        } else {
            return -1; // Invalid pin selected
        }

        // Send a 10µs pulse to trigger pin
        pins.digitalWritePin(trig, 0);
        control.waitMicros(2);
        pins.digitalWritePin(trig, 1);
        control.waitMicros(10);
        pins.digitalWritePin(trig, 0);

        // Measure the pulse duration on echo pin
        let duration = pins.pulseIn(echo, PulseValue.High, 25000);

        // Convert duration to distance in cm
        let distance = duration * 0.034 / 2;

        return distance;
    }

    /**
     * Check if an obstacle is detected within 30cm based on selected pin
     * Uses same logic as readDistanceByPin
     * @param selPin pin to select configuration
     * @returns true if obstacle is within 30cm
     */
    //% block="obstacle is there using pin $selPin"
    //% selPin.shadow="pin"
    export function isObstacle(selPin: DigitalPin): boolean {
        return readDistanceByPin(selPin) < 30;
    }



    //% group="LCD"
    let i2cAddr: number // 0x3F: PCF8574A, 0x27: PCF8574
    let BK: number      // backlight control
    let RS: number      // command/data


    // set LCD reg
    function setreg(d: number) {
        pins.i2cWriteNumber(i2cAddr, d, NumberFormat.Int8LE)
        basic.pause(1)
    }


    // send data to I2C bus
    function set(d: number) {
        d = d & 0xF0
        d = d + BK + RS
        setreg(d)
        setreg(d + 4)
        setreg(d)
    }


    // send command
    function cmd(d: number) {
        RS = 0
        set(d)
        set(d << 4)
    }


    // send data
    function dat(d: number) {
        RS = 1
        set(d)
        set(d << 4)
    }


    // auto get LCD address
    function AutoAddr() {
        let k = true
        let addr = 0x20
        let d1 = 0, d2 = 0
        while (k && (addr < 0x28)) {
            pins.i2cWriteNumber(addr, -1, NumberFormat.Int32LE)
            d1 = pins.i2cReadNumber(addr, NumberFormat.Int8LE) % 16
            pins.i2cWriteNumber(addr, 0, NumberFormat.Int16LE)
            d2 = pins.i2cReadNumber(addr, NumberFormat.Int8LE)
            if ((d1 == 7) && (d2 == 0)) k = false
            else addr += 1
        }
        if (!k) return addr


        addr = 0x38
        while (k && (addr < 0x40)) {
            pins.i2cWriteNumber(addr, -1, NumberFormat.Int32LE)
            d1 = pins.i2cReadNumber(addr, NumberFormat.Int8LE) % 16
            pins.i2cWriteNumber(addr, 0, NumberFormat.Int16LE)
            d2 = pins.i2cReadNumber(addr, NumberFormat.Int8LE)
            if ((d1 == 7) && (d2 == 0)) k = false
            else addr += 1
        }
        if (!k) return addr
        else return 0


    }




    //% group="LCD"
    /**
     * initial LCD, set I2C address. Address is 39/63 for PCF8574/PCF8574A
     * @param Addr is i2c address for LCD, eg: 0, 39, 63. 0 is auto find address
     */
    //% blockId="I2C_LCD1620_SET_ADDRESS" block="LCD initialize %addr"
    //% weight=100 blockGap=8
    //% parts=LCD1602_I2C trackArgs=0
    export function LcdInit(Addr: number) {
        if (Addr == 0) i2cAddr = AutoAddr()
        else i2cAddr = Addr
        BK = 8
        RS = 0
        cmd(0x33)       // set 4bit mode
        basic.pause(5)
        set(0x30)
        basic.pause(5)
        set(0x20)
        basic.pause(5)
        cmd(0x28)       // set mode
        cmd(0x0C)
        cmd(0x06)
        cmd(0x01)       // clear
    }


    //% group="LCD"
    /**
     * show a number in LCD at given position
     * @param n is number will be show, eg: 0, 100, 200
     * @param x is LCD column position, eg: 0
     * @param y is LCD row position, eg: 0
     */
    //% blockId="I2C_LCD1620_SHOW_NUMBER" block="show number %n|at x %x|y %y"
    //% weight=90 blockGap=8
    //% x.min=0 x.max=15
    //% y.min=0 y.max=1
    //% parts=LCD1602_I2C trackArgs=0
    export function ShowNumber(n: number, x: number, y: number): void {
        let s = n.toString()
        ShowString(s, x, y)
    }


    //% group="LCD"
    /**
     * show a string in LCD at given position
     * @param s is string will be show, eg: "Hello!"
     * @param x is LCD column position, [0 - 15], eg: 0
     * @param y is LCD row position, [0 - 1], eg: 0
     */
    //% blockId="I2C_LCD1620_SHOW_STRING" block="show string %s|at x %x|y %y"
    //% weight=90 blockGap=8
    //% x.min=0 x.max=15
    //% y.min=0 y.max=1
    //% parts=LCD1602_I2C trackArgs=0
    export function ShowString(s: string, x: number, y: number): void {
        let a: number


        if (y > 0)
            a = 0xC0
        else
            a = 0x80
        a += x
        cmd(a)


        for (let i = 0; i < s.length; i++) {
            dat(s.charCodeAt(i))
        }
    }


    //% group="LCD"
    /**
     * turn on LCD
     */
    //% blockId="I2C_LCD1620_ON" block="turn on LCD"
    //% weight=81 blockGap=8
    //% parts=LCD1602_I2C trackArgs=0
    export function on(): void {
        cmd(0x0C)
    }


    //% group="LCD"
    /**
     * turn off LCD
     */
    //% blockId="I2C_LCD1620_OFF" block="turn off LCD"
    //% weight=80 blockGap=8
    //% parts=LCD1602_I2C trackArgs=0
    export function off(): void {
        cmd(0x08)
    }


    //% group="LCD"
    /**
     * clear all display content
     */
    //% blockId="I2C_LCD1620_CLEAR" block="clear LCD"
    //% weight=85 blockGap=8
    //% parts=LCD1602_I2C trackArgs=0
    export function clear(): void {
        cmd(0x01)
    }


    //% group="LCD"
    /**
     * turn on LCD backlight
     */
    //% blockId="I2C_LCD1620_BACKLIGHT_ON" block="turn on backlight"
    //% weight=71 blockGap=8
    //% parts=LCD1602_I2C trackArgs=0
    export function BacklightOn(): void {
        BK = 8
        cmd(0)
    }
    //% group="LCD"


    /**
     * turn off LCD backlight
     */
    //% blockId="I2C_LCD1620_BACKLIGHT_OFF" block="turn off backlight"
    //% weight=70 blockGap=8
    //% parts=LCD1602_I2C trackArgs=0
    export function BacklightOff(): void {
        BK = 0
        cmd(0)
    }


    //% group="LCD"
    /**
     * shift left
     */
    //% blockId="I2C_LCD1620_SHL" block="Shift Left"
    //% weight=61 blockGap=8
    //% parts=LCD1602_I2C trackArgs=0
    export function shl(): void {
        cmd(0x18)
    }


    //% group="LCD"
    /**
     * shift right
     */
    //% blockId="I2C_LCD1620_SHR" block="Shift Right"
    //% weight=60 blockGap=8
    //% parts=LCD1602_I2C trackArgs=0
    export function shr(): void {
        cmd(0x1C)
    }




    //% group="Actuators"
    //% blockId=servo_motor block="set servo %servo to %angle°"
    //% angle.min=0 angle.max=180
    //% servo.defl=Servo.S1
    export function setServoAngle(servo: Servo, angle: number): void {
        let pin = (servo == Servo.S1) ? AnalogPin.P6 : AnalogPin.P7;
        let pulseWidth = (angle * 2000) / 180 + 500; // Convert angle (0-180) to pulse width (500-2500µs)
        pins.servoSetPulse(pin, pulseWidth);
    }


    //% blockId=servo_enum block="%servo"
    //% blockHidden=true
    export enum Servo {
        //% block="S1"
        S1 = 0,
        //% block="S2"
        S2 = 1
    }

}

