
/**
 * Visual Blocks Language for the Pololu 3Pi robot
 *
 * Copyright 2015 Anibit Technology LLC
 * https://anibit.com
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

if (!Blockly.Language)
    Blockly.Language = {};
Blockly.Arduino = Blockly.Generator.get('Arduino');
// define blocks


//Block Setup. Holder for code that is not placed in the main loop, but in the setup block

Blockly.Language.threepi_setup = {
    category: 'Arduino',
    helpUrl: 'help/blocks.html#threepi_setup',
    init: function () {
        this.setColour(0);
        this.appendDummyInput("")
                .appendTitle("Setup")
        this.appendStatementInput('DO')
                .appendTitle(Blockly.LANG_CONTROLS_REPEAT_INPUT_DO);
        this.setTooltip('Setup Block');
    }
};

Blockly.Arduino.threepi_setup = function () {
    var branch = Blockly.Arduino.statementToCode(this, 'DO');
    if (Blockly.Arduino.INFINITE_LOOP_TRAP) {
        branch = Blockly.Arduino.INFINITE_LOOP_TRAP.replace(/%1/g,
                '\'' + this.id + '\'') + branch;
    }
    var code = //'{\n' +
            branch;// + '\n}\n';
    var setup_key = Blockly.Arduino.variableDB_.getDistinctName(
            'threepi_setup', Blockly.Variables.NAME_TYPE);
    Blockly.Arduino.setups_[setup_key] = code;
    return ""; //do not return any actual code
};


//Block SET MOTORS. Sets motor speed

Blockly.Language.threepi_set_motors = {
    category: 'Motors',
    helpUrl: 'help/blocks.html#threepi_set_motors',
    init: function () {
        this.setColour(334);
        this.appendDummyInput("")
                .appendTitle("Set Motors")
        this.appendValueInput("LEFT_POWER", Number)
                .setCheck(Number)
                .setAlign(Blockly.ALIGN_RIGHT)
                .appendTitle("left")
        this.appendValueInput("RIGHT_POWER", Number)
                .setCheck(Number)
                .setAlign(Blockly.ALIGN_RIGHT)
                .appendTitle("right")
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setTooltip('Set 3Pi Motors');
    }
};

Blockly.Arduino.threepi_set_motors = function () {
    var left_power = Blockly.Arduino.valueToCode(this, 'LEFT_POWER', Blockly.Arduino.ORDER_UNARY_POSTFIX);
    //var left_power = this.getTitleValue('LEFT_POWER');
    var right_power = Blockly.Arduino.valueToCode(this, 'RIGHT_POWER', Blockly.Arduino.ORDER_UNARY_POSTFIX);
    //var right_power = this.getTitleValue('RIGHT_POWER');
    Blockly.Arduino.definitions_['include_3pi'] = '#include <Pololu3pi.h>\n';
    Blockly.Arduino.definitions_['include_3piqtrsensors'] = '#include <PololuQTRSensors.h>\n';
    Blockly.Arduino.definitions_['include_orangutanmotors'] = '#include <OrangutanMotors.h>\n';
    Blockly.Arduino.definitions_['define_orangutanmotors'] = 'OrangutanMotors motors;\n';
    Blockly.Arduino.setups_['setup_3pi'] = 'Pololu3pi::init();\n' +
            '';

    var code = "motors.setSpeeds(" + left_power + ", " + right_power + ");\n"
    return code;
};

//Block SET MOTOR. Sets a single motor speed, leaving the other motor alone

Blockly.Language.threepi_set_motor = {
    category: 'Motors - Advanced',
    isAdvanced: true,
    helpUrl: 'help/blocks.html#threepi_set_motor',
    init: function () {
        this.setColour(334);
        this.appendDummyInput("")
                .appendTitle("Set Motor")
                .appendTitle(" MOTOR#")
                .appendTitle(new Blockly.FieldDropdown([["LEFT", "left"], ["RIGHT", "right"]]), "MOTOR")
        this.appendValueInput("POWER", Number)
                .setCheck(Number)
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setTooltip('Set One of the 3Pi motors, leaving the other alone.');
    }
};

Blockly.Arduino.threepi_set_motor = function () {
    var dropdown_motor = this.getTitleValue('MOTOR');
    var power = Blockly.Arduino.valueToCode(this, 'POWER', Blockly.Arduino.ORDER_UNARY_POSTFIX);

    Blockly.Arduino.definitions_['include_3pi'] = '#include <Pololu3pi.h>\n';
    Blockly.Arduino.definitions_['include_3piqtrsensors'] = '#include <PololuQTRSensors.h>\n';
    Blockly.Arduino.definitions_['include_orangutanmotors'] = '#include <OrangutanMotors.h>\n';
    Blockly.Arduino.definitions_['define_orangutanmotors'] = 'OrangutanMotors motors;\n';
    Blockly.Arduino.setups_['setup_3pi'] = 'Pololu3pi::init();\n' +
            '';

    var code = "motors." + ((dropdown_motor == "left") ? "setM1Speed" : "setM2Speed") + "(" + power + " );\n"
    return code;
};

//Block PLAY_TONE. Plays a tone on 3Pi speaker

Blockly.Language.threepi_play_tone = {
    category: 'Sound',
    helpUrl: 'help/blocks.html#threepi_play_tone',
    init: function () {
        this.setColour(67);
        this.appendDummyInput("")
                .appendTitle("Play Tone")
        this.appendValueInput("FREQUENCY", Number)
                .setCheck(Number)
                .setAlign(Blockly.ALIGN_RIGHT)
                .appendTitle("frequency")
        this.appendValueInput("DURATION", Number)
                .setCheck(Number)
                .setAlign(Blockly.ALIGN_RIGHT)
                .appendTitle("duration")
        this.appendValueInput("VOLUME", Number)
                .setCheck(Number)
                .setAlign(Blockly.ALIGN_RIGHT)
                .appendTitle("volume")
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setTooltip('Set Speaker Tone');
    }
};

Blockly.Arduino.threepi_play_tone = function () {
    var frequency = Blockly.Arduino.valueToCode(this, 'FREQUENCY', Blockly.Arduino.ORDER_UNARY_POSTFIX);
    var duration = Blockly.Arduino.valueToCode(this, 'DURATION', Blockly.Arduino.ORDER_UNARY_POSTFIX);
    var volume = Blockly.Arduino.valueToCode(this, 'VOLUME', Blockly.Arduino.ORDER_UNARY_POSTFIX);
    Blockly.Arduino.definitions_['include_3pi'] = '#include <Pololu3pi.h>\n';
    Blockly.Arduino.definitions_['include_3piqtrsensors'] = '#include <PololuQTRSensors.h>\n';
    Blockly.Arduino.definitions_['include_orangutanbuzzer'] = '#include <OrangutanBuzzer.h>\n';
    Blockly.Arduino.definitions_['define_orangutanbuzzer'] = 'OrangutanBuzzer buzzer;\n';
    Blockly.Arduino.setups_['setup_3pi'] = 'Pololu3pi::init();\n';

    var code = "buzzer.playFrequency(" + frequency + ", " + duration + ", " + volume + ");\n"
    return code;
};

//Block PLAY_NOTE. Plays a "note" on 3Pi speaker

Blockly.Language.threepi_play_note = {
    category: 'Sound',
    helpUrl: 'help/blocks.html#threepi_play_note',
    init: function () {
        this.setColour(67);
        this.appendDummyInput("")
                .appendTitle("Play Note")
                .appendTitle(" Note:")
                .appendTitle(new Blockly.FieldDropdown([["C", "C"], ["C#", "C_SHARP"], ["D", "D"],
                    ["D#", "D_SHARP"], ["E", "E"], ["F", "F"],
                    ["F#", "F_SHARP"], ["G", "G"], ["G#", "G_SHARP"],
                    ["A", "A"], ["A#", "A_SHARP"], ["B", "B"]
                ]), "NOTE")
                .appendTitle(" Octave:")
                .appendTitle(new Blockly.FieldDropdown([["0", "0"], ["1", "1"], ["2", "2"],
                    ["3", "3"], ["4", "4"], ["5", "5"],
                    ["6", "6"]
                ]), "OCTAVE");
        this.appendValueInput("DURATION", Number)
                .setCheck(Number)
                .setAlign(Blockly.ALIGN_RIGHT)
                .appendTitle("duration")
        this.appendValueInput("VOLUME", Number)
                .setCheck(Number)
                .setAlign(Blockly.ALIGN_RIGHT)
                .appendTitle("volume")
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setTooltip('Play a note on the speaker');
    }
};

Blockly.Arduino.threepi_play_note = function () {
    var dropdown_note = this.getTitleValue('NOTE');
    var dropdown_octave = this.getTitleValue('OCTAVE');
    var duration = Blockly.Arduino.valueToCode(this, 'DURATION', Blockly.Arduino.ORDER_UNARY_POSTFIX);
    var volume = Blockly.Arduino.valueToCode(this, 'VOLUME', Blockly.Arduino.ORDER_UNARY_POSTFIX);
    Blockly.Arduino.definitions_['include_3pi'] = '#include <Pololu3pi.h>\n';
    Blockly.Arduino.definitions_['include_3piqtrsensors'] = '#include <PololuQTRSensors.h>\n';
    Blockly.Arduino.definitions_['include_orangutanbuzzer'] = '#include <OrangutanBuzzer.h>\n';
    Blockly.Arduino.definitions_['define_orangutanbuzzer'] = 'OrangutanBuzzer buzzer;\n';
    Blockly.Arduino.setups_['setup_3pi'] = 'Pololu3pi::init();\n';

    var code = "buzzer.playNote(NOTE_" + dropdown_note + "(" + dropdown_octave + ")," + duration + ", " + volume + ");\n";
    return code;
};

//Block PLAY_MUSIC. Plays a music on 3Pi speaker

Blockly.Language.threepi_play_music = {
    category: 'Sound - Advanced',
    isAdvanced: true,
    helpUrl: 'help/blocks.html#threepi_play_music',
    init: function () {
        this.setColour(67);
        this.appendDummyInput("")
                .appendTitle("Play Music")
                .appendTitle(" String:")
                //TODO validate music string
                .appendTitle(new Blockly.FieldTextInput("", null), "MUSIC_STRING");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setTooltip('Play music on the speaker');
    }
};

Blockly.Arduino.threepi_play_music = function () {
    var music_string = this.getTitleValue('MUSIC_STRING');
    Blockly.Arduino.definitions_['include_3pi'] = '#include <Pololu3pi.h>\n';
    Blockly.Arduino.definitions_['include_3piqtrsensors'] = '#include <PololuQTRSensors.h>\n';
    Blockly.Arduino.definitions_['include_orangutanbuzzer'] = '#include <OrangutanBuzzer.h>\n';
    Blockly.Arduino.definitions_['define_orangutanbuzzer'] = 'OrangutanBuzzer buzzer;\n';
    Blockly.Arduino.setups_['setup_3pi'] = 'Pololu3pi::init();\n';

    var code = "buzzer.playFromProgramSpace(PSTR(\"" + music_string + "\"));\n";
    return code;
};

//Block STOP_MUSIC. Stops the music currently playing

Blockly.Language.threepi_stop_music = {
    category: 'Sound - Advanced',
    isAdvanced: true,
    helpUrl: 'help/blocks.html#threepi_stop_music',
    init: function () {
        this.setColour(67);
        this.appendDummyInput("")
                .appendTitle("Stop music")
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setTooltip('Stops the music playing.');
    }
};

Blockly.Arduino.threepi_stop_music = function () {
    Blockly.Arduino.definitions_['include_3pi'] = '#include <Pololu3pi.h>\n';
    Blockly.Arduino.definitions_['include_3piqtrsensors'] = '#include <PololuQTRSensors.h>\n';
    Blockly.Arduino.definitions_['include_orangutanbuzzer'] = '#include <OrangutanBuzzer.h>\n';
    Blockly.Arduino.definitions_['define_orangutanbuzzer'] = 'OrangutanBuzzer buzzer;\n';
    Blockly.Arduino.setups_['setup_3pi'] = 'Pololu3pi::init();\n';

    var code = "buzzer.stop_playing();\n";
    return code;
};

//Block IS_MUSIC_PLAYING. queries if the music is currently playing 

Blockly.Language.threepi_is_music_playing = {
    category: 'Sound - Advanced',
    isAdvanced: true,
    helpUrl: 'help/blocks.html#threepi_is_music_playing',
    init: function () {
        this.setColour(67);
        this.appendDummyInput("")
                .appendTitle("Is Music Playing")
        this.setTooltip('Checks if the music is currently playing.');
        this.setOutput(true, Number);
    }
};

Blockly.Arduino.threepi_is_music_playing = function () {
    Blockly.Arduino.definitions_['include_3pi'] = '#include <Pololu3pi.h>\n';
    Blockly.Arduino.definitions_['include_3piqtrsensors'] = '#include <PololuQTRSensors.h>\n';
    Blockly.Arduino.definitions_['include_orangutanbuzzer'] = '#include <OrangutanBuzzer.h>\n';
    Blockly.Arduino.definitions_['define_orangutanbuzzer'] = 'OrangutanBuzzer buzzer;\n';
    Blockly.Arduino.setups_['setup_3pi'] = 'Pololu3pi::init();\n';

    var code = "(buzzer.isPlaying())";
    return [code, Blockly.Arduino.ORDER_ATOMIC]
};



//Block WAIT_FOR_MUSIC. Waits until music is not playing

Blockly.Language.threepi_wait_for_music = {
    category: 'Sound - Advanced',
    isAdvanced: true,
    helpUrl: 'help/blocks.html#threepi_wait_for_music',
    init: function () {
        this.setColour(67);
        this.appendDummyInput("")
                .appendTitle("Wait for music")
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setTooltip('Pauses program until music has finished playing');
    }
};

Blockly.Arduino.threepi_wait_for_music = function () {
    var music_string = this.getTitleValue('MUSIC_STRING');
    Blockly.Arduino.definitions_['include_3pi'] = '#include <Pololu3pi.h>\n';
    Blockly.Arduino.definitions_['include_3piqtrsensors'] = '#include <PololuQTRSensors.h>\n';
    Blockly.Arduino.definitions_['include_orangutanbuzzer'] = '#include <OrangutanBuzzer.h>\n';
    Blockly.Arduino.definitions_['define_orangutanbuzzer'] = 'OrangutanBuzzer buzzer;\n';
    Blockly.Arduino.setups_['setup_3pi'] = 'Pololu3pi::init();\n';

    var code = "while (buzzer.isPlaying());\n";
    return code;
};


//Block SET LED. Turns LED's off and on

Blockly.Language.threepi_set_led = {
    category: 'Lights',
    helpUrl: 'help/blocks.html#threepi_set_led',
    init: function () {
        this.setColour(38);
        this.appendDummyInput("")
                .appendTitle("Set Led")
                .appendTitle(" LED#")
                .appendTitle(new Blockly.FieldDropdown([["RED", "red"], ["GREEN", "green"], ["LEFT", "left"], ["RIGHT", "right"]]), "LED")
                .appendTitle(" state: ")
                .appendTitle(new Blockly.FieldDropdown([["ON", "HIGH"], ["OFF", "LOW"], ["TOGGLE", "TOGGLE"]]), "STATE");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setTooltip('Set LED state');
    }
};

Blockly.Arduino.threepi_set_led = function () {
    var dropdown_led = this.getTitleValue('LED');
    var dropdown_state = this.getTitleValue('STATE');
    Blockly.Arduino.definitions_['include_3pi'] = '#include <Pololu3pi.h>\n';
    Blockly.Arduino.definitions_['include_3piqtrsensors'] = '#include <PololuQTRSensors.h>\n';
    Blockly.Arduino.definitions_['include_orangutanleds'] = '#include <OrangutanLEDs.h>\n';
    Blockly.Arduino.definitions_['define_orangutanleds'] = 'OrangutanLEDs leds;\n';
    var code = 'leds.' + dropdown_led + '(' + dropdown_state + ');\n'
    return code;
};

//Block WAIT FOR BUTTON, waits until a button is pressed

Blockly.Language.threepi_wait_for_button = {
    category: 'In/Out',
    helpUrl: 'help/blocks.html#threepi_wait_for_button',
    init: function () {
        this.setColour(128);
        this.appendDummyInput("")
                .appendTitle("Wait for button")
                .appendTitle(" Button#")
                .appendTitle(new Blockly.FieldDropdown([["A", "BUTTON_A"], ["B", "BUTTON_B"], ["C", "BUTTON_C"], ["ANY", "ANY_BUTTON"]]), "BUTTON");
        this.setTooltip('Wait until a button is pressed');
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
    }
};

Blockly.Arduino.threepi_wait_for_button = function () {
    var dropdown_button = this.getTitleValue('BUTTON');
    Blockly.Arduino.definitions_['include_3pi'] = '#include <Pololu3pi.h>\n';
    Blockly.Arduino.definitions_['include_3piqtrsensors'] = '#include <PololuQTRSensors.h>\n';
    Blockly.Arduino.definitions_['include_orangutanpushbuttons'] = '#include <OrangutanPushbuttons.h>\n';
    Blockly.Arduino.definitions_['define_orangutanpushbuttons'] = 'OrangutanPushbuttons buttons;\n';
    var code = 'buttons.waitForPress(' + dropdown_button + ');\n';
    return code;
};

//Block Get button value, waits until a button is pressed

Blockly.Language.threepi_get_button_value = {
    category: 'In/Out',
    helpUrl: 'help/blocks.html#threepi_get_button_value',
    init: function () {
        this.setColour(128);
        this.appendDummyInput("")
                .appendTitle("Get button value")
                .appendTitle(" Button#")
                .appendTitle(new Blockly.FieldDropdown([["A", "BUTTON_A"], ["B", "BUTTON_B"], ["C", "BUTTON_C"]]), "BUTTON")
                .appendTitle(" Wait# ")
                .appendTitle(new Blockly.FieldDropdown([["YES", "true"], ["NO", "false"]]), "WAIT");
        this.setTooltip('Gets the pressed state of a 3Pi button');
        this.setOutput(true, Number);
    }
};

Blockly.Arduino.threepi_get_button_value = function () {
    var dropdown_button = this.getTitleValue('BUTTON');
    var dropdown_wait = this.getTitleValue('WAIT');
    Blockly.Arduino.definitions_['include_3pi'] = '#include <Pololu3pi.h>\n';
    Blockly.Arduino.definitions_['include_3piqtrsensors'] = '#include <PololuQTRSensors.h>\n';
    Blockly.Arduino.definitions_['include_orangutanpushbuttons'] = '#include <OrangutanPushbuttons.h>\n';
    Blockly.Arduino.definitions_['define_orangutanpushbuttons'] = 'OrangutanPushbuttons buttons;\n';
    var code = "#error"
    if (dropdown_wait === 'true') {
        code = "(buttons.waitForPress(" + dropdown_button + ") & " + dropdown_button + " == " + dropdown_button + ")";
    } else {
        code = "(buttons.isPressed(" + dropdown_button + ") & " + dropdown_button + " == " + dropdown_button + ")";
    }
    return [code, Blockly.Arduino.ORDER_ATOMIC]
};

//Block PRINT_LCD_TEXT

Blockly.Language.threepi_print_lcd_text = {
    category: 'Display',
    helpUrl: 'help/blocks.html#threepi_print_lcd_text',
    init: function () {
        this.setColour(25);
        this.appendValueInput("CONTENT", String)
                .appendTitle("Print LCD Text");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setTooltip('Prints text to the LCD screen');
    }
};

Blockly.Arduino.threepi_print_lcd_text = function () {
    var content = Blockly.Arduino.valueToCode(this, 'CONTENT', Blockly.Arduino.ORDER_ATOMIC) || '0'
    //content = content.replace('(','').replace(')','');

    Blockly.Arduino.definitions_['include_3pi'] = '#include <Pololu3pi.h>\n';
    Blockly.Arduino.definitions_['include_3piqtrsensors'] = '#include <PololuQTRSensors.h>\n';
    Blockly.Arduino.definitions_['include_orangutanlcd'] = '#include <OrangutanLCD.h>\n';
    Blockly.Arduino.definitions_['define_orangutanlcd'] = 'OrangutanLCD lcd;\n';
    Blockly.Arduino.setups_['setup_3pi'] = 'Pololu3pi::init();\n';
    var code = 'lcd.print(' + content + ');\n';
    return code;
};

//Block PRINT_LCD_NUMBER

Blockly.Language.threepi_print_lcd_number = {
    category: 'Display',
    helpUrl: 'help/blocks.html#threepi_print_lcd_number',
    init: function () {
        this.setColour(25);
        this.appendValueInput("CONTENT", Number)
                .appendTitle("Print LCD Number");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setTooltip('Prints a number to the LCD screen');
    }
};

Blockly.Arduino.threepi_print_lcd_number = function () {
    var content = Blockly.Arduino.valueToCode(this, 'CONTENT', Blockly.Arduino.ORDER_UNARY_POSTFIX) || 0;
    //content = content.replace('(','').replace(')','');

    Blockly.Arduino.definitions_['include_3pi'] = '#include <Pololu3pi.h>\n';
    Blockly.Arduino.definitions_['include_3piqtrsensors'] = '#include <PololuQTRSensors.h>\n';
    Blockly.Arduino.definitions_['include_orangutanlcd'] = '#include <OrangutanLCD.h>\n';
    Blockly.Arduino.definitions_['define_orangutanlcd'] = 'OrangutanLCD lcd;\n';
    Blockly.Arduino.setups_['setup_3pi'] = 'Pololu3pi::init();\n';
    //using long is slightly wasteful, but helps reduce end-user surprises.
    var code = 'lcd.print((long)' + content + ');\n';
    return code;
};


//Block CLEAR_LCD

Blockly.Language.threepi_clear_lcd = {
    category: 'Display',
    helpUrl: 'help/blocks.html#threepi_clear_lcd',
    init: function () {
        this.setColour(25);
        this.appendDummyInput("")
                .appendTitle("Clear LCD")
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setTooltip('Clears the LCD screen');
    }
};

Blockly.Arduino.threepi_clear_lcd = function () {

    Blockly.Arduino.definitions_['include_3pi'] = '#include <Pololu3pi.h>\n';
    Blockly.Arduino.definitions_['include_3piqtrsensors'] = '#include <PololuQTRSensors.h>\n';
    Blockly.Arduino.definitions_['include_orangutanlcd'] = '#include <OrangutanLCD.h>\n';
    Blockly.Arduino.definitions_['define_orangutanlcd'] = 'OrangutanLCD lcd;\n';
    Blockly.Arduino.setups_['setup_3pi'] = 'Pololu3pi::init();\n';
    var code = 'lcd.clear();\n';
    return code;
};

//Block LCD GOTO XY

Blockly.Language.threepi_goto_x_y = {
    category: 'Display',
    helpUrl: 'help/blocks.html#threepi_goto_x_y',
    init: function () {
        this.setColour(25);
        this.appendDummyInput("")
                .appendTitle("LCD Goto X Y")
        this.appendValueInput("X", Number)
                .setCheck(Number)
                .setAlign(Blockly.ALIGN_RIGHT)
                .appendTitle("X")
        this.appendValueInput("Y", Number)
                .setCheck(Number)
                .setAlign(Blockly.ALIGN_RIGHT)
                .appendTitle("Y")
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setTooltip('Moves the LCD cursor to X and Y position');
    }
};

Blockly.Arduino.threepi_goto_x_y = function () {
    var x = Blockly.Arduino.valueToCode(this, 'X', Blockly.Arduino.ORDER_UNARY_POSTFIX);
    var y = Blockly.Arduino.valueToCode(this, 'Y', Blockly.Arduino.ORDER_UNARY_POSTFIX);
    Blockly.Arduino.definitions_['include_3pi'] = '#include <Pololu3pi.h>\n';
    Blockly.Arduino.definitions_['include_3piqtrsensors'] = '#include <PololuQTRSensors.h>\n';
    Blockly.Arduino.definitions_['include_orangutanlcd'] = '#include <OrangutanLCD.h>\n';
    Blockly.Arduino.definitions_['define_orangutanlcd'] = 'OrangutanLCD lcd;\n';
    Blockly.Arduino.setups_['setup_3pi'] = 'Pololu3pi::init();\n';

    var code = 'lcd.gotoXY(' + x + ', ' + y + ');\n';
    return code;
};


//Block SCROLL LCD - scrolls the LCD display.

Blockly.Language.threepi_scroll_lcd = {
    category: 'Display',
    helpUrl: 'help/blocks.html#threepi_scroll_lcd',
    init: function () {
        this.setColour(25);
        this.appendDummyInput("")
                .appendTitle("Scroll LCD")
                .appendTitle(" Direction")
                .appendTitle(new Blockly.FieldDropdown([["Left", "LCD_LEFT"], ["Right", "LCD_RIGHT"]]), "DIRECTION")
        this.appendValueInput("SPACES", Number)
                .setCheck(Number)
                .setAlign(Blockly.ALIGN_RIGHT)
                .appendTitle("spaces")
        this.appendValueInput("DELAY", Number)
                .setCheck(Number)
                .setAlign(Blockly.ALIGN_RIGHT)
                .appendTitle("delay")
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setTooltip('Scrolls the LCD text left or right');
    }
};

Blockly.Arduino.threepi_scroll_lcd = function () {
    var dropdown_direction = this.getTitleValue('DIRECTION');
    var spaces = Blockly.Arduino.valueToCode(this, 'SPACES', Blockly.Arduino.ORDER_UNARY_POSTFIX);
    var delay = Blockly.Arduino.valueToCode(this, 'DELAY', Blockly.Arduino.ORDER_UNARY_POSTFIX);
    Blockly.Arduino.definitions_['include_3pi'] = '#include <Pololu3pi.h>\n';
    Blockly.Arduino.definitions_['include_3piqtrsensors'] = '#include <PololuQTRSensors.h>\n';
    Blockly.Arduino.definitions_['include_orangutanlcd'] = '#include <OrangutanLCD.h>\n';
    Blockly.Arduino.definitions_['define_orangutanlcd'] = 'OrangutanLCD lcd;\n';
    Blockly.Arduino.setups_['setup_3pi'] = 'Pololu3pi::init();\n';

    var code = 'lcd.scroll(' + dropdown_direction + ', ' + spaces + ", " + delay + ');\n';
    return code;
};


//Block LCD GOTO XY

Blockly.Language.threepi_set_user_led = {
    category: '3Pi - Advanced',
    helpUrl: 'help/blocks.html#threepi_goto_x_y',
    isAdvanced: true,
    init: function () {
        this.setColour(190);
        this.appendDummyInput("")
                .appendTitle("Set User LED")
        this.appendValueInput("X", Number)
                .setCheck(Number)
                .setAlign(Blockly.ALIGN_RIGHT)
                .appendTitle("X")
        this.appendValueInput("Y", Number)
                .setCheck(Number)
                .setAlign(Blockly.ALIGN_RIGHT)
                .appendTitle("Y")
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setTooltip('Moves the LCD cursor to X and Y position');
    }
};

Blockly.Arduino.threepi_set_user_led = function () {
    var x = Blockly.Arduino.valueToCode(this, 'X', Blockly.Arduino.ORDER_UNARY_POSTFIX);
    var y = Blockly.Arduino.valueToCode(this, 'Y', Blockly.Arduino.ORDER_UNARY_POSTFIX);
    Blockly.Arduino.definitions_['include_3pi'] = '#include <Pololu3pi.h>\n';
    Blockly.Arduino.definitions_['include_3piqtrsensors'] = '#include <PololuQTRSensors.h>\n';
    Blockly.Arduino.definitions_['include_orangutanlcd'] = '#include <OrangutanLCD.h>\n';
    Blockly.Arduino.definitions_['define_orangutanlcd'] = 'OrangutanLCD lcd;\n';
    Blockly.Arduino.setups_['setup_3pi'] = 'Pololu3pi::init();\n';

    var code = 'lcd.gotoXY(' + x + ', ' + y + ');\n';
    return code;
};

//Block Get Trim Pot, gets a reading on the TRIMPOT

Blockly.Language.threepi_get_trimpot = {
    category: '3Pi Analog',
    helpUrl: 'help/blocks.html#threepi_get_trimpot',
    isAdvanced: true,
    init: function () {
        this.setColour(38);
        this.appendDummyInput("")
                .appendTitle("Get trimpot")
        this.setTooltip('Gets the value of the user trimpot on the bottom of the 3Pi');
        this.setOutput(true, Number);
    }
};

Blockly.Arduino.threepi_get_trimpot = function () {
    Blockly.Arduino.definitions_['include_3pi'] = '#include <Pololu3pi.h>\n';
    Blockly.Arduino.definitions_['include_3piqtrsensors'] = '#include <PololuQTRSensors.h>\n';
    Blockly.Arduino.definitions_['include_orangutananalog'] = '#include <OrangutanAnalog.h>\n';
    Blockly.Arduino.definitions_['define_orangutananalog'] = 'OrangutanAnalog analog;\n';
    Blockly.Arduino.setups_['setup_3pi'] = 'Pololu3pi::init();\n';
    Blockly.Arduino.setups_['setup_orangutananalog'] = 'analog.setMode(MODE_10_BIT);\n';
    var code = "(analog.readTrimpot())";
    return [code, Blockly.Arduino.ORDER_ATOMIC]
};

//Block Get Battery Level, gets a reading on the 3Pi battery level

Blockly.Language.threepi_get_battery = {
    category: '3Pi Analog',
    helpUrl: 'help/blocks.html#threepi_get_battery',
    init: function () {
        this.setColour(38);
        this.appendDummyInput("")
                .appendTitle("Get Battery")
        this.setTooltip('Gets the value of the battery level of the 3Pi');
        this.setOutput(true, Number);
    }
};

Blockly.Arduino.threepi_get_battery = function () {
    Blockly.Arduino.definitions_['include_3pi'] = '#include <Pololu3pi.h>\n';
    Blockly.Arduino.definitions_['include_3piqtrsensors'] = '#include <PololuQTRSensors.h>\n';
    Blockly.Arduino.definitions_['include_orangutananalog'] = '#include <OrangutanAnalog.h>\n';
    Blockly.Arduino.definitions_['define_orangutananalog'] = 'OrangutanAnalog analog;\n';
    Blockly.Arduino.setups_['setup_3pi'] = 'Pololu3pi::init();\n';
    Blockly.Arduino.setups_['setup_orangutananalog'] = 'analog.setMode(MODE_10_BIT);\n';
    var code = "(analog.readBatteryMillivolts_3pi)";
    return [code, Blockly.Arduino.ORDER_ATOMIC]
};

//Block Read Line Sensors, causes the 3Pi to read values from the line sensors

Blockly.Language.threepi_read_line_sensors = {
    category: 'Line Sensors - Advanced',
    helpUrl: 'help/blocks.html#threepi_read_line_sensors',
    isAdvanced: true,
    init: function () {
        this.setColour(241);
        this.appendDummyInput("")
                .appendTitle("Read Line Sensors");
        this.setTooltip('Reads the line sensors, use before "Get Line Sensor Value"');
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
    }
};

Blockly.Arduino.threepi_read_line_sensors = function () {
    Blockly.Arduino.definitions_['include_3pi'] = '#include <Pololu3pi.h>\n';
    Blockly.Arduino.definitions_['include_3piqtrsensors'] = '#include <PololuQTRSensors.h>\n';
    Blockly.Arduino.definitions_['include_orangutananalog'] = '#include <OrangutanAnalog.h>\n';
    Blockly.Arduino.definitions_['define_3pi'] = 'Pololu3pi robot;\n';
    Blockly.Arduino.definitions_['define_sensors'] = 'unsigned int sensors[5];\n';
    Blockly.Arduino.setups_['setup_3pi'] = 'Pololu3pi::init();\n';
    //TODO we may want to allow for different parameters for IR behavior here!
    var code = "robot.readLineSensors(sensors);\n";
    return code;
};

//Block Get Line Sensor Value, returns a value from a previous line sensor reading

Blockly.Language.threepi_get_line_sensor_value = {
    category: 'Line Sensors - Advanced',
    helpUrl: 'help/blocks.html#threepi_get_line_sensor_value',
    isAdvanced: true,
    init: function () {
        this.setColour(241);
        this.appendDummyInput("")
                .appendTitle("Get Line Sensor Value")
                .appendTitle(" Sensor")
                .appendTitle(new Blockly.FieldDropdown([["0", "0"], ["1", "1"], ["2", "2"],
                    ["3", "3"], ["4", "4"]]), "SENSOR");
        this.setTooltip('Gets the value for a previous line sensor reading');
        this.setOutput(true, Number);
    }
};

Blockly.Arduino.threepi_get_line_sensor_value = function () {
    var dropdown_sensor = this.getTitleValue('SENSOR');
    Blockly.Arduino.definitions_['include_3pi'] = '#include <Pololu3pi.h>\n';
    Blockly.Arduino.definitions_['include_3piqtrsensors'] = '#include <PololuQTRSensors.h>\n';
    Blockly.Arduino.definitions_['include_orangutananalog'] = '#include <OrangutanAnalog.h>\n';
    Blockly.Arduino.definitions_['define_3pi'] = 'Pololu3pi robot;\n';
    Blockly.Arduino.definitions_['define_sensors'] = 'unsigned int sensors[5];\n';
    Blockly.Arduino.setups_['setup_3pi'] = 'Pololu3pi::init();\n';
    var code = "(sensors[" + dropdown_sensor + "])";
    return [code, Blockly.Arduino.ORDER_ATOMIC]
};

//Block Calibrate Line Sensors, causes the 3Pi to read values from the line sensors

Blockly.Language.threepi_calibrate_line_sensors = {
    category: 'Line Sensors - Advanced',
    helpUrl: 'help/blocks.html#threepi_calibrate_line_sensors',
    isAdvanced: true,
    init: function () {
        this.setColour(241);
        this.appendDummyInput("")
                .appendTitle("Calibrate Line Sensors");
        this.setTooltip('Causes the 3Pi to calibrate the line sensors at the current position');
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
    }
};

Blockly.Arduino.threepi_calibrate_line_sensors = function () {
    Blockly.Arduino.definitions_['include_3pi'] = '#include <Pololu3pi.h>\n';
    Blockly.Arduino.definitions_['include_3piqtrsensors'] = '#include <PololuQTRSensors.h>\n';
    Blockly.Arduino.definitions_['include_orangutananalog'] = '#include <OrangutanAnalog.h>\n';
    Blockly.Arduino.definitions_['define_3pi'] = 'Pololu3pi robot;\n';
    Blockly.Arduino.definitions_['define_sensors'] = 'unsigned int sensors[5];\n';
    Blockly.Arduino.setups_['setup_3pi'] = 'Pololu3pi::init();\n';
    Blockly.Arduino.setups_['setup_calsensors'] = 'robot.lineSensorsResetCalibration();\n';
    //TODO we may want to allow for different parameters for IR behavior here!
    var code = "robot.calibrateLineSensors();\n";
    return code;
};


//Block Read Calibrated Line Sensors, causes the 3Pi to read values from the line sensors
Blockly.Language.threepi_read_calibrated_line_sensors = {
    category: 'Line Sensors - Advanced',
    helpUrl: 'help/blocks.html#threepi_read_calibrated_line_sensors',
    isAdvanced: true,
    init: function () {
        this.setColour(241);
        this.appendDummyInput("")
                .appendTitle("Read Calibrated Line Sensors");
        this.setTooltip('Reads the line sensors using calibration, use before "Get Line Sensor Value", And make sure to calibrate first!');
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
    }
};

Blockly.Arduino.threepi_read_calibrated_line_sensors = function () {
    Blockly.Arduino.definitions_['include_3pi'] = '#include <Pololu3pi.h>\n';
    Blockly.Arduino.definitions_['include_3piqtrsensors'] = '#include <PololuQTRSensors.h>\n';
    Blockly.Arduino.definitions_['include_orangutananalog'] = '#include <OrangutanAnalog.h>\n';
    Blockly.Arduino.definitions_['define_3pi'] = 'Pololu3pi robot;\n';
    Blockly.Arduino.definitions_['define_sensors'] = 'unsigned int sensors[5];\n';
    Blockly.Arduino.setups_['setup_3pi'] = 'Pololu3pi::init();\n';
    Blockly.Arduino.setups_['setup_calsensors'] = 'robot.lineSensorsResetCalibration();\n';
    //TODO we may want to allow for different parameters for IR behavior here!
    var code = "robot.readLineSensorsCalibrated(sensors);\n";
    return code;
};

//Block Get Line, returns a value from a previous line sensor reading

Blockly.Language.threepi_read_line = {
    category: 'Line Sensors - Advanced',
    helpUrl: 'help/blocks.html#threepi_read_line',
    isAdvanced: true,
    init: function () {
        this.setColour(241);
        this.appendDummyInput("")
                .appendTitle("Read Line")
                .appendTitle(" Line Color")
                .appendTitle(new Blockly.FieldDropdown([["Black", "0"], ["White", "1"]]), "LINE_COLOR");
        this.setTooltip('Gets the value for a previous line sensor reading');
        this.setOutput(true, Number);
    }
};

Blockly.Arduino.threepi_read_line = function () {
    var dropdown_line_color = this.getTitleValue('LINE_COLOR');
    Blockly.Arduino.definitions_['include_3pi'] = '#include <Pololu3pi.h>\n';
    Blockly.Arduino.definitions_['include_3piqtrsensors'] = '#include <PololuQTRSensors.h>\n';
    Blockly.Arduino.definitions_['include_orangutananalog'] = '#include <OrangutanAnalog.h>\n';
    Blockly.Arduino.definitions_['define_3pi'] = 'Pololu3pi robot;\n';
    Blockly.Arduino.definitions_['define_sensors'] = 'unsigned int sensors[5];\n';
    Blockly.Arduino.setups_['setup_3pi'] = 'Pololu3pi::init();\n';
    Blockly.Arduino.setups_['setup_calsensors'] = 'robot.lineSensorsResetCalibration();\n';
    var code = "(robot.readLine(sensors, IR_EMITTERS_ON, " + dropdown_line_color + "))";
    return [code, Blockly.Arduino.ORDER_ATOMIC]
};

