//% color=#62068C icon="\uf2db" block="Bit-Z"
namespace dCode {

    // --------------------------------------------------
    // Helper Functions
    // --------------------------------------------------
    function setP2High(connector: Connector): void {
        if (connector == Connector.P2) {
            pins.digitalWritePin(DigitalPin.P8, 1)
        }
    }

    function getDigitalPin(connector: Connector): DigitalPin {
        if (connector == Connector.P0) {
            return DigitalPin.P0
        } else if (connector == Connector.P1) {
            return DigitalPin.P1
        } else {
            pins.digitalWritePin(DigitalPin.P8, 1)
            return DigitalPin.P2
        }
    }

    function getAnalogPin(connector: Connector): AnalogPin {
        if (connector == Connector.P0) {
            return AnalogPin.P3
        } else if (connector == Connector.P1) {
            return AnalogPin.P4
        } else {
            pins.digitalWritePin(DigitalPin.P8, 1)
            return AnalogPin.P5
        }
    }

    // --------------------------------------------------
    // Car Control
    // --------------------------------------------------
    //% group="Car Control"
    //% blockId=car_control block="Move car %direction speed %speed"
    //% speed.min=0 speed.max=100
    //% speed.defl=100
    export function carMove(direction: CarDirection, speed: number): void {
        let pwmValue = Math.map(speed, 0, 100, 0, 1023)

        switch (direction) {
            case CarDirection.Forward:
                pins.analogWritePin(AnalogPin.P13, pwmValue)
                pins.analogWritePin(AnalogPin.P14, 0)
                pins.analogWritePin(AnalogPin.P15, pwmValue)
                pins.analogWritePin(AnalogPin.P16, 0)
                break

            case CarDirection.Backward:
                pins.analogWritePin(AnalogPin.P13, 0)
                pins.analogWritePin(AnalogPin.P14, pwmValue)
                pins.analogWritePin(AnalogPin.P15, 0)
                pins.analogWritePin(AnalogPin.P16, pwmValue)
                break

            case CarDirection.Left:
                pins.analogWritePin(AnalogPin.P13, 0)
                pins.analogWritePin(AnalogPin.P14, pwmValue)
                pins.analogWritePin(AnalogPin.P15, pwmValue)
                pins.analogWritePin(AnalogPin.P16, 0)
                break

            case CarDirection.Right:
                pins.analogWritePin(AnalogPin.P13, pwmValue)
                pins.analogWritePin(AnalogPin.P14, 0)
                pins.analogWritePin(AnalogPin.P15, 0)
                pins.analogWritePin(AnalogPin.P16, pwmValue)
                break

            case CarDirection.Stop:
                pins.analogWritePin(AnalogPin.P13, 0)
                pins.analogWritePin(AnalogPin.P14, 0)
                pins.analogWritePin(AnalogPin.P15, 0)
                pins.analogWritePin(AnalogPin.P16, 0)
                break
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

    // --------------------------------------------------
    // Connector Enum
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
    //% blockId=digital_sensor block="read Digital sensor at connector %connector"
    export function readDigitalSensor(connector: Connector): number {
        let pin = getDigitalPin(connector)
        pins.setPull(pin, PinPullMode.PullUp)
        return pins.digitalReadPin(pin)
    }

    //% group="Sensors"
    //% blockId=analog_sensor block="read Analog sensor at connector %connector"
    export function readAnalogSensor(connector: Connector): number {
        let pin = getAnalogPin(connector)
        return pins.analogReadPin(pin)
    }

    //% group="Sensors"
    //% blockId=dht11_sensor block="read DHT11 %dhtData at connector %connector"
    export function readDHT11(dhtData: DHT11Data, connector: Connector): number {
        let pin = getDigitalPin(connector)
        let buffer: number[] = []
        let startTime: number
        let signal: number

        // Start signal
        pins.digitalWritePin(pin, 0)
        basic.pause(18)
        pins.digitalWritePin(pin, 1)
        control.waitMicros(40)
        pins.setPull(pin, PinPullMode.PullUp)

        // Wait for response
        while (pins.digitalReadPin(pin) == 1);
        while (pins.digitalReadPin(pin) == 0);
        while (pins.digitalReadPin(pin) == 1);

        // Read 40 bits
        for (let i = 0; i < 40; i++) {
            while (pins.digitalReadPin(pin) == 0);
            startTime = control.micros()
            while (pins.digitalReadPin(pin) == 1);
            signal = control.micros() - startTime
            buffer.push(signal > 40 ? 1 : 0)
        }

        let humidity = buffer.slice(0, 8).reduce((a, b) => (a << 1) | b, 0)
        let temperature = buffer.slice(16, 24).reduce((a, b) => (a << 1) | b, 0)

        return dhtData == DHT11Data.Temperature ? temperature : humidity
    }

    //% blockId=dht11_data block="%dhtData"
    //% blockHidden=true
    export enum DHT11Data {
        //% block="Temperature (°C)"
        Temperature = 0,
        //% block="Humidity (%)"
        Humidity = 1
    }

    // --------------------------------------------------
    // Traffic Light
    // Red -> P8
    // Yellow -> P2
    // Green -> P5
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
    // Ultrasonic Sensor
    // --------------------------------------------------
    /**
     * Measure distance using ultrasonic sensor based on selected connector
     * P0 -> Trigger: P1, Echo: P0
     * P1 -> Trigger: P2, Echo: P1
     * P2 -> Trigger: P0, Echo: P2 and P8 HIGH
     */
    //% group="Sensors"
    //% block="distance using connector %connector"
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

    /**
     * Check if obstacle is detected within 30 cm
     */
    //% group="Sensors"
    //% block="obstacle is there using connector %connector"
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
        let d1 = 0
        let d2 = 0

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
     * initial LCD, set I2C address
     */
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

    /**
     * show a number in LCD
     */
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

    /**
     * show a string in LCD
     */
    //% group="LCD"
    //% blockId="I2C_LCD1620_SHOW_STRING" block="show string %s|at x %x|y %y"
    //% weight=90 blockGap=8
    //% x.min=0 x.max=15
    //% y.min=0 y.max=1
    //% parts=LCD1602_I2C trackArgs=0
    export function ShowString(s: string, x: number, y: number): void {
        let a: number

        if (y > 0) a = 0xC0
        else a = 0x80

        a += x
        cmd(a)

        for (let i = 0; i < s.length; i++) {
            dat(s.charCodeAt(i))
        }
    }

    /**
     * turn on LCD
     */
    //% group="LCD"
    //% blockId="I2C_LCD1620_ON" block="turn on LCD"
    //% weight=81 blockGap=8
    //% parts=LCD1602_I2C trackArgs=0
    export function on(): void {
        cmd(0x0C)
    }

    /**
     * turn off LCD
     */
    //% group="LCD"
    //% blockId="I2C_LCD1620_OFF" block="turn off LCD"
    //% weight=80 blockGap=8
    //% parts=LCD1602_I2C trackArgs=0
    export function off(): void {
        cmd(0x08)
    }

    /**
     * clear LCD
     */
    //% group="LCD"
    //% blockId="I2C_LCD1620_CLEAR" block="clear LCD"
    //% weight=85 blockGap=8
    //% parts=LCD1602_I2C trackArgs=0
    export function clear(): void {
        cmd(0x01)
    }

    /**
     * turn on backlight
     */
    //% group="LCD"
    //% blockId="I2C_LCD1620_BACKLIGHT_ON" block="turn on backlight"
    //% weight=71 blockGap=8
    //% parts=LCD1602_I2C trackArgs=0
    export function BacklightOn(): void {
        BK = 8
        cmd(0)
    }

    /**
     * turn off backlight
     */
    //% group="LCD"
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
    //% group="LCD"
    //% blockId="I2C_LCD1620_SHL" block="Shift Left"
    //% weight=61 blockGap=8
    //% parts=LCD1602_I2C trackArgs=0
    export function shl(): void {
        cmd(0x18)
    }

    /**
     * shift right
     */
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

    //% blockId=servo_enum block="%servo"
    //% blockHidden=true
    export enum Servo {
        //% block="S1"
        S1 = 0,
        //% block="S2"
        S2 = 1
    }
}