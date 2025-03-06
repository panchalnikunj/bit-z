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


}