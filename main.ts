//% color=#6c3baa icon="\uf2db" block="Bit-Z"
namespace dCode {

    // --------------------------------------------------
    // Helper
    // --------------------------------------------------
    function setP2Enable(connector: Connector): void {
        if (connector == Connector.P2) {
            pins.digitalWritePin(DigitalPin.P8, 1)
        }
    }

    // --------------------------------------------------
    // Motors
    // --------------------------------------------------
    //% group="Motors"
    //% blockId=motor_control block="run motor %motor %direction speed %speed"
    //% speed.min=0 speed.max=100
    //% speed.defl=100
    export function runMotor(motor: Motor, direction: MotorDirection, speed: number): void {
        let pwmValue = Math.map(speed, 0, 100, 0, 1023)
        let pinA: AnalogPin
        let pinB: AnalogPin

        if (motor == Motor.M1) {
            pinA = AnalogPin.P13
            pinB = AnalogPin.P14
        } else {
            pinA = AnalogPin.P15
            pinB = AnalogPin.P16
        }

        switch (direction) {
            case MotorDirection.Forward:
                pins.analogWritePin(pinA, pwmValue)
                pins.analogWritePin(pinB, 0)
                break
            case MotorDirection.Backward:
                pins.analogWritePin(pinA, 0)
                pins.analogWritePin(pinB, pwmValue)
                break
            case MotorDirection.Stop:
                pins.analogWritePin(pinA, 0)
                pins.analogWritePin(pinB, 0)
                break
        }
    }

    //% group="Motors"
    //% blockId=stop_all_motors block="stop all motors"
    export function stopAllMotors(): void {
        pins.analogWritePin(AnalogPin.P13, 0)
        pins.analogWritePin(AnalogPin.P14, 0)
        pins.analogWritePin(AnalogPin.P15, 0)
        pins.analogWritePin(AnalogPin.P16, 0)
    }

    export enum Motor {
        //% block="M1"
        M1 = 0,
        //% block="M2"
        M2 = 1
    }

    export enum MotorDirection {
        //% block="forward"
        Forward = 0,
        //% block="backward"
        Backward = 1,
        //% block="stop"
        Stop = 2
    }

    // --------------------------------------------------
    // Connectors
    // --------------------------------------------------
    export enum Connector {
        //% block="P0"
        P0 = 0,
        //% block="P1"
        P1 = 1,
        //% block="P2"
        P2 = 2
    }

    // --------------------------------------------------
    // Sensors
    // --------------------------------------------------
    //% group="Sensors"
    //% blockId=digital_sensor block="read digital sensor at %connector"
    export function readDigitalSensor(connector: Connector): number {
        let pin: DigitalPin

        if (connector == Connector.P0) {
            pin = DigitalPin.P0
        } else if (connector == Connector.P1) {
            pin = DigitalPin.P1
        } else {
            pin = DigitalPin.P2
            pins.digitalWritePin(DigitalPin.P8, 1)
        }

        pins.setPull(pin, PinPullMode.PullUp)
        return pins.digitalReadPin(pin)
    }

    //% group="Sensors"
    //% blockId=analog_sensor block="read analog sensor at %connector"
    export function readAnalogSensor(connector: Connector): number {
        let pin: AnalogPin

        if (connector == Connector.P0) {
            pin = AnalogPin.P3
        } else if (connector == Connector.P1) {
            pin = AnalogPin.P4
        } else {
            pin = AnalogPin.P5
            pins.digitalWritePin(DigitalPin.P8, 1)
        }

        return pins.analogReadPin(pin)
    }

    //% group="Sensors"
    //% blockId=dht11_sensor block="read DHT11 %dhtData at %connector"
    export function readDHT11(dhtData: DHT11Data, connector: Connector): number {
        let pin: DigitalPin
        let buffer: number[] = []
        let startTime: number
        let signal: number

        if (connector == Connector.P0) {
            pin = DigitalPin.P0
        } else if (connector == Connector.P1) {
            pin = DigitalPin.P1
        } else {
            pin = DigitalPin.P2
            pins.digitalWritePin(DigitalPin.P8, 1)
        }

        pins.digitalWritePin(pin, 0)
        basic.pause(18)
        pins.digitalWritePin(pin, 1)
        control.waitMicros(40)
        pins.setPull(pin, PinPullMode.PullUp)

        while (pins.digitalReadPin(pin) == 1);
        while (pins.digitalReadPin(pin) == 0);
        while (pins.digitalReadPin(pin) == 1);

        for (let i = 0; i < 40; i++) {
            while (pins.digitalReadPin(pin) == 0);
            startTime = control.micros()
            while (pins.digitalReadPin(pin) == 1);
            signal = control.micros() - startTime
            buffer.push(signal > 40 ? 1 : 0)
        }

        let humidity = (buffer.slice(0, 8).reduce((a, b) => (a << 1) | b, 0))
        let temperature = (buffer.slice(16, 24).reduce((a, b) => (a << 1) | b, 0))

        return dhtData == DHT11Data.Temperature ? temperature : humidity
    }

    export enum DHT11Data {
        //% block="Temperature (°C)"
        Temperature = 0,
        //% block="Humidity (%)"
        Humidity = 1
    }

    // --------------------------------------------------
    // Traffic Light
    // Red    -> P8
    // Yellow -> P2
    // Green  -> P5
    // --------------------------------------------------
    //% group="Traffic Light"
    //% block="turn $led LED $state"
    //% state.shadow="toggleOnOff"
    //% blockGap=8
    export function controlLED(led: LedColor, state: boolean): void {
        let pin: DigitalPin

        if (led == LedColor.Red) {
            pin = DigitalPin.P8
        } else if (led == LedColor.Yellow) {
            pin = DigitalPin.P2
        } else {
            pin = DigitalPin.P5
        }

        pins.digitalWritePin(pin, state ? 1 : 0)
    }

    //% group="Traffic Light"
    //% block="turn all LEDs $state"
    //% state.shadow="toggleOnOff"
    //% blockGap=8
    export function controlAll(state: boolean): void {
        pins.digitalWritePin(DigitalPin.P8, state ? 1 : 0) // Red
        pins.digitalWritePin(DigitalPin.P2, state ? 1 : 0) // Yellow
        pins.digitalWritePin(DigitalPin.P5, state ? 1 : 0) // Green
    }

    export enum LedColor {
        //% block="Red"
        Red,
        //% block="Yellow"
        Yellow,
        //% block="Green"
        Green
    }

    // --------------------------------------------------
    // Ultrasonic
    // --------------------------------------------------
    /**
     * Measure distance using ultrasonic sensor based on selected connector
     * P0 -> trig P1, echo P0
     * P1 -> trig P2, echo P1
     * P2 -> trig P0, echo P2 and P8 HIGH
     */
    //% group="Sensors"
    //% block="distance using %connector"
    export function readDistanceByPin(connector: Connector): number {
        let trig: DigitalPin
        let echo: DigitalPin

        if (connector == Connector.P0) {
            trig = DigitalPin.P1
            echo = DigitalPin.P0
        } else if (connector == Connector.P1) {
            trig = DigitalPin.P2
            echo = DigitalPin.P1
        } else {
            trig = DigitalPin.P0
            echo = DigitalPin.P2
            pins.digitalWritePin(DigitalPin.P8, 1)
        }

        pins.digitalWritePin(trig, 0)
        control.waitMicros(2)
        pins.digitalWritePin(trig, 1)
        control.waitMicros(10)
        pins.digitalWritePin(trig, 0)

        let duration = pins.pulseIn(echo, PulseValue.High, 30000)
        let distance = duration * 0.034 / 2

        return distance
    }

    //% group="Sensors"
    //% block="obstacle is there using %connector"
    export function isObstacle(connector: Connector): boolean {
        return readDistanceByPin(connector) < 30
    }

    // --------------------------------------------------
    // LCD
    // --------------------------------------------------
    //% group="LCD"
    let i2cAddr: number
    let BK: number
    let RS: number

    function setreg(d: number) {
        pins.i2cWriteNumber(i2cAddr, d, NumberFormat.Int8LE)
        basic.pause(1)
    }

    function set(d: number) {
        d = d & 0xF0
        d = d + BK + RS
        setreg(d)
        setreg(d + 4)
        setreg(d)
    }

    function cmd(d: number) {
        RS = 0
        set(d)
        set(d << 4)
    }

    function dat(d: number) {
        RS = 1
        set(d)
        set(d << 4)
    }

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
    //% blockId="I2C_LCD1620_SET_ADDRESS" block="LCD initialize %addr"
    //% weight=100 blockGap=8
    //% parts=LCD1602_I2C trackArgs=0
    export function LcdInit(Addr: number) {
        if (Addr == 0) i2cAddr = AutoAddr()
        else i2cAddr = Addr
        BK = 8
        RS = 0
        cmd(0x33)
        basic.pause(5)
        set(0x30)
        basic.pause(5)
        set(0x20)
        basic.pause(5)
        cmd(0x28)
        cmd(0x0C)
        cmd(0x06)
        cmd(0x01)
    }

    //% group="LCD"
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
    //% blockId="I2C_LCD1620_ON" block="turn on LCD"
    //% weight=81 blockGap=8
    //% parts=LCD1602_I2C trackArgs=0
    export function on(): void {
        cmd(0x0C)
    }

    //% group="LCD"
    //% blockId="I2C_LCD1620_OFF" block="turn off LCD"
    //% weight=80 blockGap=8
    //% parts=LCD1602_I2C trackArgs=0
    export function off(): void {
        cmd(0x08)
    }

    //% group="LCD"
    //% blockId="I2C_LCD1620_CLEAR" block="clear LCD"
    //% weight=85 blockGap=8
    //% parts=LCD1602_I2C trackArgs=0
    export function clear(): void {
        cmd(0x01)
    }

    //% group="LCD"
    //% blockId="I2C_LCD1620_BACKLIGHT_ON" block="turn on backlight"
    //% weight=71 blockGap=8
    //% parts=LCD1602_I2C trackArgs=0
    export function BacklightOn(): void {
        BK = 8
        cmd(0)
    }

    //% group="LCD"
    //% blockId="I2C_LCD1620_BACKLIGHT_OFF" block="turn off backlight"
    //% weight=70 blockGap=8
    //% parts=LCD1602_I2C trackArgs=0
    export function BacklightOff(): void {
        BK = 0
        cmd(0)
    }

    //% group="LCD"
    //% blockId="I2C_LCD1620_SHL" block="Shift Left"
    //% weight=61 blockGap=8
    //% parts=LCD1602_I2C trackArgs=0
    export function shl(): void {
        cmd(0x18)
    }

    //% group="LCD"
    //% blockId="I2C_LCD1620_SHR" block="Shift Right"
    //% weight=60 blockGap=8
    //% parts=LCD1602_I2C trackArgs=0
    export function shr(): void {
        cmd(0x1C)
    }

    // --------------------------------------------------
    // Servo
    // --------------------------------------------------
    //% group="Actuators"
    //% blockId=servo_motor block="set servo %servo to %angle°"
    //% angle.min=0 angle.max=180
    //% servo.defl=Servo.S1
    export function setServoAngle(servo: Servo, angle: number): void {
        let pin = (servo == Servo.S1) ? AnalogPin.P6 : AnalogPin.P7
        let pulseWidth = (angle * 2000) / 180 + 500
        pins.servoSetPulse(pin, pulseWidth)
    }

    export enum Servo {
        //% block="S1"
        S1 = 0,
        //% block="S2"
        S2 = 1
    }
}