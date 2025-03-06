//% color=#000000 icon="\uf2db" block="Bit-Z"
namespace dCode {
    //% group="Car Control"
    //% blockId=car_control block="Move car %direction speed %speed"
    //% speed.min=0 speed.max=100
    export function carMove(direction: CarDirection, speed: number): void {
        let pwmValue = Math.map(speed, 0, 100, 0, 1023);

        switch (direction) {
            case CarDirection.Forward:
                pins.analogWritePin(AnalogPin.P12, pwmValue);
                pins.analogWritePin(AnalogPin.P13, 0);
                pins.analogWritePin(AnalogPin.P14, 0);
                pins.analogWritePin(AnalogPin.P15, pwmValue);
                break;
            case CarDirection.Backward:
                pins.analogWritePin(AnalogPin.P12, 0);
                pins.analogWritePin(AnalogPin.P13, pwmValue);
                pins.analogWritePin(AnalogPin.P14, pwmValue);
                pins.analogWritePin(AnalogPin.P15, 0);
                break;
            case CarDirection.Left:
                pins.analogWritePin(AnalogPin.P12, 0);
                pins.analogWritePin(AnalogPin.P13, pwmValue);
                pins.analogWritePin(AnalogPin.P14, 0);
                pins.analogWritePin(AnalogPin.P15, pwmValue);
                break;
            case CarDirection.Right:
                pins.analogWritePin(AnalogPin.P12, pwmValue);
                pins.analogWritePin(AnalogPin.P13, 0);
                pins.analogWritePin(AnalogPin.P14, pwmValue);
                pins.analogWritePin(AnalogPin.P15, 0);
                break;
            case CarDirection.Stop:
                pins.analogWritePin(AnalogPin.P12, 0);
                pins.analogWritePin(AnalogPin.P13, 0);
                pins.analogWritePin(AnalogPin.P14, 0);
                pins.analogWritePin(AnalogPin.P15, 0);
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

    /**
     * initial LCD, set I2C address. Address is 39/63 for PCF8574/PCF8574A
     * @param Addr is i2c address for LCD, eg: 0, 39, 63. 0 is auto find address
     */
    //% blockId="I2C_LCD1620_SET_ADDRESS" block="LCD initialize with Address %addr"
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

    /**
     * show a number in LCD at given position
     * @param n is number will be show, eg: 10, 100, 200
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

    /**
     * show a string in LCD at given position
     * @param s is string will be show, eg: "Hello"
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

    /**
     * turn on LCD
     */
    //% blockId="I2C_LCD1620_ON" block="turn on LCD"
    //% weight=81 blockGap=8
    //% parts=LCD1602_I2C trackArgs=0
    export function on(): void {
        cmd(0x0C)
    }

    /**
     * turn off LCD
     */
    //% blockId="I2C_LCD1620_OFF" block="turn off LCD"
    //% weight=80 blockGap=8
    //% parts=LCD1602_I2C trackArgs=0
    export function off(): void {
        cmd(0x08)
    }

    /**
     * clear all display content
     */
    //% blockId="I2C_LCD1620_CLEAR" block="clear LCD"
    //% weight=85 blockGap=8
    //% parts=LCD1602_I2C trackArgs=0
    export function clear(): void {
        cmd(0x01)
    }

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

    /**
     * shift left
     */
    //% blockId="I2C_LCD1620_SHL" block="Shift Left"
    //% weight=61 blockGap=8
    //% parts=LCD1602_I2C trackArgs=0
    export function shl(): void {
        cmd(0x18)
    }

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
     * Measures distance in centimeters using an HC-SR04 sensor.
     * @param trigPin The trigger pin
     * @param echoPin The echo pin
     */
    //% blockId=ultrasonic_distance block="measure distance trig %trigPin| echo %echoPin"
    //% trigPin.defl=DigitalPin.P0 echoPin.defl=DigitalPin.P1
    export function measureDistance(trigPin: DigitalPin, echoPin: DigitalPin): number {
        pins.digitalWritePin(trigPin, 0);
        control.waitMicros(2);
        pins.digitalWritePin(trigPin, 1);
        control.waitMicros(10);
        pins.digitalWritePin(trigPin, 0);

        let duration = pins.pulseIn(echoPin, PulseValue.High, 23000);
        let distance = duration / 58;

        return distance > 400 ? 400 : distance; // Limit to 400 cm (sensor range)
    }

    //% group="Sensors"
    //% blockId=analog_sensor block="read Analog sensor at pin %pin"
    //% pin.defl=AnalogPin.P0
    export function readAnalogSensor(pin: AnalogPin): number {
        return pins.analogReadPin(pin);
    }


    //% group="Sensors"
    //% blockId=digital_sensor block="read Digital sensor at pin %pin"
    //% pin.defl=DigitalPin.P1
    export function readDigitalSensor(pin: DigitalPin): number {
        return pins.digitalReadPin(pin);
    }



    //% group="LCD Display"
    /**
     * Displays text on an I2C 16x2 LCD display at a specified column and row.
     * @param text The text to display
     * @param col The column number (0-15)
     * @param row The row number (0 or 1)
     */
    //% blockId=i2c_lcd_display block="display %text=text on LCD at column %col row %row"
    //% col.min=0 col.max=15 row.min=0 row.max=1
    export function displayTextLCD(text: string | number | boolean, col: number, row: number): void {
        let addr = 0x27; // Default I2C address for 16x2 LCD
        let buf = pins.createBuffer(2);
        buf[0] = 0x80 | (row == 0 ? 0x00 : 0x40) | col; // Set cursor position
        pins.i2cWriteBuffer(addr, buf);

        // Convert non-string values to string
        let strText: string;
        if (typeof text === "boolean") {
            strText = text ? "true" : "false";
        } else {
            strText = "" + text; // Convert number to string
        }

        // Write text to LCD
        for (let i = 0; i < strText.length; i++) {
            buf[0] = strText.charCodeAt(i);
            pins.i2cWriteBuffer(addr, buf);
        }
    }




    //% group="LCD Display"
    /**
     * Clears the I2C 16x2 LCD display.
     */
    //% blockId=i2c_lcd_clear block="clear LCD display"
    export function clearLCD(): void {
        let addr = 0x27; // Default I2C address for 16x2 LCD
        let buf = pins.createBuffer(1);
        buf[0] = 0x01; // Clear display command
        pins.i2cWriteBuffer(addr, buf);
        basic.pause(2); // Wait for LCD to clear
    }



    //% group="LCD Display"
    //% blockId=i2c_lcd_scroll block="scroll %text on LCD speed %speed ms | direction %direction=scr_direction"
    //% speed.min=50 speed.max=500
    export function scrollTextLCD(text: string, speed: number, direction: ScrollDirection): void {
        let addr = 0x27; // Default I2C address for 16x2 LCD
        let buf = pins.createBuffer(1);

        // Display the initial text at position (0,0)
        displayTextLCD(text, 0, 0);

        // Scroll text left or right
        for (let i = 0; i < 16; i++) {
            buf[0] = (direction == ScrollDirection.Left) ? 0x18 : 0x1C; // LCD shift command
            pins.i2cWriteBuffer(addr, buf);
            basic.pause(speed);
        }
    }

    //% blockId=scr_direction block="%direction"
    //% blockHidden=true
    export enum ScrollDirection {
        //% block="Left"
        Left = 0,
        //% block="Right"
        Right = 1
    }


    //% group="LCD Display"
    //% blockId=i2c_lcd_backlight block="LCD backlight %state=backlight_state"
    export function setLcdBacklight(state: BacklightState): void {
        let addr = 0x27; // Default I2C address for 16x2 LCD
        let backlightCmd = (state == BacklightState.On) ? 0x08 : 0x00; // 0x08 = ON, 0x00 = OFF

        pins.i2cWriteNumber(addr, backlightCmd, NumberFormat.UInt8BE);
    }

    //% blockId=backlight_state block="%state"
    //% blockHidden=true
    export enum BacklightState {
        //% block="ON"
        On = 1,
        //% block="OFF"
        Off = 0
    }





}