/**
* @version: 0.2
* @author: Jayanth Ravindarn
* @copyright: Copyright (c) 2024 Jayanth Ravindran. All rights reserved.
* @license: Licensed under the MIT license. See http://www.opensource.org/licenses/mit-license.php
* @website: https://github.com/jravz/dynamic_table
*/
// Following the UMD template https://github.com/umdjs/umd/blob/master/templates/returnExportsGlobal.js
(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.DynamicTable = factory();
    }
}(this, function() {
    function DynamicTable(element, options) {
        this.element = element; // 
        this.rows = options.rows || 3;
        this.cols = options.cols || 3;         
        this.columnOptions = options.columnOptions || {};
        this.appliedClasses = options.appliedClasses || {};
        this.tableId = options.tableId || 'dynamicTable'; // ID for the table element
        this.prefix = options.prefix || this.tableId;
        this.inputType = options.inputType || 'text'; // Input type: 'text' or 'decimal'
        this.dataMap = new Map();
        this.headerNames = [];
        this.addStyles();
        this.specialControlFunctions = new Map();
        this.renderTable(); // Generate the table when instantiated        
        this.selectionMap = Array.from({ length: this.rows }, () => Array(this.cols).fill(0));
        this.pivotRow = -1;
        this.pivotCol = -1;
        this.isMouseDown = false; // Track mouse down state for drag selection        
        this.initClickOutsideListener(); // Detect clicks outside the table        
        this.initAllSpecialControls(); //controls such as dates needs datepicker   
        this.initiateDecimalRelatedVars();     
    }

    DynamicTable.prototype.initiateDecimalRelatedVars = function() {
        this.controlKeys = ["Backspace", "ArrowLeft", "ArrowRight", "Delete", "Tab"];  
        this.decimalKeyRange = [...Array.from({ length: 10 }, (_, i) => "" + i), ...this.controlKeys];
        this.decimalKeyRange.push("."); //the dot operator to signify decimals
    };

    DynamicTable.prototype.initAllSpecialControls = function() {
        for (const [kls,func] of this.specialControlFunctions) {            
            func();            
        }
    };

    //can add rows if there are pre existing rows. Else use table definition
    DynamicTable.prototype.addRow = function(rowNo = null, options = null) {                        
        let tbody = $('#'+this.tableId).find('tbody')[0];
        
        let tr = document.createElement('tr');
        let row = this.rows + 1;
        //apply classes to tr
        if (options != null) {
            tr.classList.add(...options);
        }
        else if (this.appliedClasses['tr']?.[''+row]) {
            tr.classList.add(...this.appliedClasses['tr'][''+row]);
        } else if (this.appliedClasses['tr']?.[''+(row-1)]) { //else apply from previous row if unavailable
            tr.classList.add(...this.appliedClasses['tr'][''+(row-1)]);
            this.appliedClasses['tr'][''+(row)] = this.appliedClasses['tr'][''+(row-1)]
        }

        //add each column
        for (var col = 1; col <= this.cols; col++) {
            let td = document.createElement('td');

            //apply classes to td
            if (this.appliedClasses['td']?.[''+col]) {
                td.classList.add(...this.appliedClasses['td'][''+col]);                
            }

            var input = this.setInput(this.columnOptions[`${col}`]||{},row, col);             

            //add event listeners
            this.initEventListeners(input);
            this.element.addEventListener('keydown', this.handleKeyDown.bind(this,this));
            input.addEventListener('keydown', this.handleKeyDown.bind(this, input));                
            input.addEventListener('mousedown', this.handleInputMouseDown.bind(this, input));
            input.addEventListener('mouseover', this.handleMouseOver.bind(this, input)); // To handle dragging
            input.addEventListener('change', this.addToDataMap.bind(this, input));    

            td.appendChild(input);
            tr.appendChild(td);
        }
        
        tbody.appendChild(tr);        
        this.rows += 1; //on success add the row numbers
        this.resizeSelectionMap();
    }

    DynamicTable.prototype.removeRow = function(rowNo = null) {
        if (this.rows === 0) {
            console.log("No more rows to remove in table.");
            return;
        }

        let table = $('#'+this.tableId)[0];
        if (rowNo === null) {
            rowNo = this.rows;
        }

        table.deleteRow(rowNo);
        this.rows -= 1;
        this.resizeSelectionMap();

    } 
    
    DynamicTable.prototype.addCol = function(colOptions) {
        for (let key in colOptions) {
            this.columnOptions[key] = colOptions[key];
            
            //adding header
            let tr = $(`#${this.tableId} thead tr`)[0];
            // let tr = thead.find('tr')[0];
            var th = document.createElement('th');
            th.classList.add(...this.appliedClasses['thead']);
            let colName = colOptions[key]?.['headerName'] || 'Column ' + key; 
            if (this.headerNames.includes(colName)) {
                let index = 1;  
                let testName = colName;
                while(this.headerNames.includes(testName)){testName = colName+index; ++index;}
                this.headerNames.push(testName);th.innerText = testName;
            }
            else {this.headerNames.push(colName);th.innerText = colName;}

            tr.appendChild(th);

            //adding columns to rows
            var parentObj = this;
            $(`#${this.tableId} tbody tr`).each(function(i, tr) {
                var row = i + 1; //row index starts from 1 rather than 0
                var td = document.createElement('td');
                //apply classes to td
                if (parentObj.appliedClasses['td']?.[''+key]) {
                    td.classList.add(...parentObj.appliedClasses['td'][''+key]);
                }

                var input = parentObj.setInput(parentObj.columnOptions[key]||{},row, parentObj.cols+1);
                //add event listeners
                parentObj.initEventListeners(input);
                parentObj.element.addEventListener('keydown', parentObj.handleKeyDown.bind(parentObj,parentObj));
                input.addEventListener('keydown', parentObj.handleKeyDown.bind(parentObj, input));                
                input.addEventListener('mousedown', parentObj.handleInputMouseDown.bind(parentObj, input));
                input.addEventListener('mouseover', parentObj.handleMouseOver.bind(parentObj, input)); // To handle dragging
                input.addEventListener('change', parentObj.addToDataMap.bind(parentObj, input));    

                td.appendChild(input);
                tr.appendChild(td); 
            });

            // let table = document.getElementById('#'+this.tableId);
            // for (var row = 1; row <= this.rows; row++) {
            //     var tr = table.rows[row];
            //     var td = document.createElement('td');
            //     //apply classes to td
            //     if (this.appliedClasses['td']?.[''+col]) {
            //         td.classList.add(...this.appliedClasses['td'][''+col]);
            //     }

            //     var input = this.setInput(this.columnOptions[key]||{},row, this.cols+1);
            //     //add event listeners
            //     this.initEventListeners(input);
            //     this.element.addEventListener('keydown', this.handleKeyDown.bind(this,this));
            //     input.addEventListener('keydown', this.handleKeyDown.bind(this, input));                
            //     input.addEventListener('mousedown', this.handleInputMouseDown.bind(this, input));
            //     input.addEventListener('mouseover', this.handleMouseOver.bind(this, input)); // To handle dragging
            //     input.addEventListener('change', this.addToDataMap.bind(this, input));    

            //     td.appendChild(input);
            //     tr.appendChild(td);                                

            this.cols += 1; //on successful addition across all rows
            this.resizeSelectionMap();
        }
    }

    DynamicTable.prototype.removeCol = function() {
        let columnIndex = this.cols - 1; //pick the last column
        let tableId = '#' + this.tableId;

        $(tableId + ' tr').each(function() {
            // Find the column at the given index and remove it
            $(this).find('th, td').eq(columnIndex).remove();
        });

        this.cols -= 1;
        this.headerNames.pop(); //remove last column
        this.resizeSelectionMap();
    }
    
    DynamicTable.prototype.resizeSelectionMap = function() {

        this.selectionMap = Array.from({ length: this.rows }, () => Array(this.cols).fill(0));
        this.repaintRange(-1,-1,-1,-1);
        this.pivotRow = this.pivotCol = -1;

    }

    DynamicTable.prototype.renderTable = function() {
        // Create table element
        var table = document.createElement('table');
        table.id = this.tableId;
        table.className = 'dynamic-table';

        //apply classes to table
        if (this.appliedClasses['table']) {
            table.classList.add(...this.appliedClasses['table']);
        }

        // Create the table header row
        var thead = document.createElement('thead');
        var headerRow = document.createElement('tr');
        for (var col = 1; col <= this.cols; col++) {
            var th = document.createElement('th');
            let colName = this.columnOptions[`${col}`]?.['headerName'] || 'Column ' + col;
            th.classList.add(...this.appliedClasses['thead']);
            
            if (this.headerNames.includes(colName)) {
                let index = 1;  
                let testName = colName;
                while(this.headerNames.includes(testName)){testName = colName+index; ++index;}
                this.headerNames.push(testName);th.innerText = testName;
            }
            else {this.headerNames.push(colName);th.innerText = colName;}
            
            headerRow.appendChild(th);
        }
        thead.appendChild(headerRow);
        table.appendChild(thead);

        // Create the table body
        var tbody = document.createElement('tbody');
        for (var row = 1; row <= this.rows; row++) {
            var tr = document.createElement('tr');

            //apply classes to tr
            if (this.appliedClasses['tr']?.[''+row]) {
                tr.classList.add(...this.appliedClasses['tr'][''+row]);
            }

            for (var col = 1; col <= this.cols; col++) {
                var td = document.createElement('td');

                //apply classes to td
                if (this.appliedClasses['td']?.[''+col]) {
                    td.classList.add(...this.appliedClasses['td'][''+col]);
                }

                var input = this.setInput(this.columnOptions[`${col}`]||{},row, col);             

                //add event listeners
                this.initEventListeners(input);
                this.element.addEventListener('keydown', this.handleKeyDown.bind(this,this));
                input.addEventListener('keydown', this.handleKeyDown.bind(this, input));                
                input.addEventListener('mousedown', this.handleInputMouseDown.bind(this, input));
                input.addEventListener('mouseover', this.handleMouseOver.bind(this, input)); // To handle dragging
                input.addEventListener('change', this.addToDataMap.bind(this, input));    

                td.appendChild(input);
                tr.appendChild(td);
            }
            tbody.appendChild(tr);
        }
        table.appendChild(tbody);

        // Append the table to the specified element
        this.element.appendChild(table);
    };

    DynamicTable.prototype.addToDataMap = function(input) {
        const [row,col] = this.getRowCol(input);
        const colName = this.headerNames[col];
        value = input.value;
        if (!this.dataMap.get(row)) {
            this.dataMap.set(row,new Map());
        }    
        let x = this.dataMap.get(row);
        x.set(colName,value);
    };

    function mapToObject(map) {
        let obj = {};
        map.forEach((value, key) => {
            // If value is a Map, convert it to an object recursively
            if (value instanceof Map) {
                obj[key] = mapToObject(value);
            } else {
                obj[key] = value;
            }
        });
        return obj;
    }

    

    DynamicTable.prototype.getValue = function() {
        
        return JSON.stringify(this.getValueAsObject()); 

    };

    DynamicTable.prototype.getValueAsObject = function() {

        let obj = {};

        for(i = 1; i <= this.rows; i++) {
            obj[i] = {};
            for (j = 1; j <= this.cols; j++) {
                const val = document.getElementById(`${this.prefix}_r${i}c${j}`).value;
                if (val) {obj[i][this.headerNames[j-1]] = val};
            }
        }

        return obj; //return object itself to be able to process the values in their original form
    };

    DynamicTable.prototype.addStyles = function() {
        let style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = `
            #${this.element.id} input[type=number]::-webkit-outer-spin-button,
            #${this.element.id} input[type=number]::-webkit-inner-spin-button {
                -webkit-appearance: none; /* Hides the spin buttons in Chrome, Safari, and Edge */
                margin: 0; /* Remove default margin */
            }
            #${this.element.id} input[type=number] {
                -moz-appearance: textfield; /* Hides the spin buttons in Firefox */
            }
        `;
        document.head.appendChild(style); // Append the <style> to the <head>
    };

    DynamicTable.prototype.setValue = function(dyntable, values) {                
        Object.entries(values).forEach(
            ([key,colValues]) => {                
                Object.entries(colValues).forEach(
                    ([k,v]) => {                       
                        const colIndex = dyntable.headerNames.indexOf(k);
                        if (colIndex != -1) {
                            const cellIndex = this.prefix + '_r' + key + 'c' + (colIndex+1);
                            cell = document.getElementById(cellIndex);
                            cell.value = v;
                        }                          
                    }
                );                                              
            }
        );      
    };

    DynamicTable.prototype.handleKeyDownForInput = function(input, event) {                
        
        let [row,col] = this.getRowCol(input);        
        switch (event.keyCode) {
            case 37:
                event.preventDefault();        
                if (col > 0) {
                    col = col - 1;
                    this.onFirstCellSelection(input, row, col);
                }                 
                break;
            case 38: 
                event.preventDefault();        
                if (row > 0 ) {
                    row = row - 1;
                    this.onFirstCellSelection(input, row, col);
                }
                break;
            case 39: 
                event.preventDefault();                       
                if (col < (this.cols - 1)) { 
                    col = col + 1; 
                    this.onFirstCellSelection(input, row, col);
                }
                break;
            case 40:
                event.preventDefault();        
                if (row < (this.rows - 1)) { 
                    row = row + 1; 
                    this.onFirstCellSelection(input, row, col);
                }
                break;                
        }
   
        
    };

    DynamicTable.prototype.onFirstCellSelection = function(input, newRow, newCol) {
        let targetId = `${this.prefix}_r${newRow+1}c${newCol+1}`;        
        let cell = document.getElementById(targetId);
        if (input.classList.contains('selected')) {            
            input.classList.remove('selected');            
        }
        if (!cell.classList.contains('selected')) {           
            cell.classList.add('selected');
            cell.focus();
        }

        this.initiateSelectionMap(cell); 
        [this.pivotRow, this.pivotCol] = this.getRowCol(cell);       
        const [lowestRow,highestRow,lowestCol,highestCol] = this.selectionMapRange();      
        this.repaintRange(lowestRow,highestRow,lowestCol,highestCol);
    };

    DynamicTable.prototype.handleKeyDown = function(input, event) {                
        if (input.classList && input.classList.contains('table-input')) {            
            if (!(event.metaKey || event.ctrlKey) && !event.shiftKey && ['ArrowDown','ArrowUp'].includes(event.key)) {
                event.preventDefault(); // Prevents the default action
                this.handleKeyDownForInput(input,event);            
            }

            if ((!navigator) && (event.metaKey || event.ctrlKey) && !event.shiftKey && ['C','c'].includes(event.key)) {                                                
                this.handleCopy(event);                     
                event.stopPropagation();       
            }

            if ((!navigator) && (event.metaKey || event.ctrlKey) && !event.shiftKey && ['V','v'].includes(event.key)) {                
                if (input.type === 'date' || input.type === 'select-one') {
                    this.handlePaste(event); 
                    event.stopPropagation(); 
                }
                      
            }

        }
        

        // Detect if Cmd (macOS) or Ctrl (Windows/Linux), Shift, and ArrowDown are pressed together
        if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === 'ArrowDown') {            
            const [lowestRow,highestRow,lowestCol,highestCol] = this.selectionMapRange();
            this.repaintRange(lowestRow, this.rows, lowestCol, highestCol);
            event.preventDefault();
        }        

        if (event.key === 'Delete') {
            let twoDArray = [];
            twoDArray.push(['']);
            this.pasteDataToTable(twoDArray); // Prevents the default action
        }
    };

    // Detect if someone clicks outside the table and remove the table selection
    DynamicTable.prototype.initClickOutsideListener = function() {     
        const tableElement = this.element; // Table element
        const dynTable = this;

        document.addEventListener('click', function(event) {                    
            // Check if the click was outside the table and clears selection
            if (!tableElement.contains(event.target)) {              
                dynTable.resetSelectionMap();
                dynTable.repaintRange(-1,-1,-1,-1);                
            }
        });
    };  


    DynamicTable.prototype.handleInputMouseDown = function(input, event) {        
        event.stopPropagation();         
        this.isMouseDown = true; // Start selection        
        this.initiateSelectionMap(input); 
        [this.pivotRow, this.pivotCol] = this.getRowCol(input);       
        const [lowestRow,highestRow,lowestCol,highestCol] = this.selectionMapRange();      
        this.repaintRange(lowestRow,highestRow,lowestCol,highestCol);       
        document.addEventListener('mouseup', this.handleMouseUp.bind(this,input)); // Attach mouseup listener       
    };

    // Handle mouse over event to select cells while dragging
    DynamicTable.prototype.handleMouseOver = function(input, event) {
        
        if (this.isMouseDown) {            
            this.addToSelectionMap(input);                                                
        }
    };

    // Handle mouse up event to stop selecting
    DynamicTable.prototype.handleMouseUp = function(input,event) {
        this.isMouseDown = false; // Stop selection
        document.removeEventListener('mouseup',this.handleMouseUp.bind(this,input)); // Remove mouseup listener
    };

    DynamicTable.prototype.resetSelectionMap = function() {
        // Set all values to zero using forEach        
        this.selectionMap.forEach((row, i) => {
            row.forEach((_, j) => {
                this.selectionMap[i][j] = 0;
            });
        });
    };

    DynamicTable.prototype.initiateSelectionMap = function(input) {        
        this.resetSelectionMap();
        const regex =  new RegExp(this.prefix + "_r(\\d+)c(\\d+)"); 
        let cellId = input.id;        
        const match = cellId.match(regex);        
        if (match) {
            const row = parseInt(match[1], 10); // Extracted row value as an integer
            const col = parseInt(match[2], 10); // Extracted column value as an integer        
            this.selectionMap[row-1][col-1] = 1;            
        } else {
            console.log("No match found.");
        }
    };

    DynamicTable.prototype.getRowCol = function(input) {
        const regex = new RegExp(this.prefix + "_r(\\d+)c(\\d+)");       
        let cellId = input.id;
        const match = cellId.match(regex);

        if (match) {
            const row = parseInt(match[1], 10); // Extracted row value as an integer
            const col = parseInt(match[2], 10); // Extracted column value as an integer                   
            return [row-1,col-1];
        } else {
            return [-1,-1];
        }
    };

    DynamicTable.prototype.addToSelectionMap = function(input) {
        let [row, col] = this.getRowCol(input);
        
        lowestRow = Math.min(this.pivotRow,row);
        lowestCol = Math.min(this.pivotCol,col);
        highestRow = Math.max(this.pivotRow,row);
        highestCol = Math.max(this.pivotCol,col);         
       
        this.repaintRange(lowestRow,highestRow,lowestCol,highestCol);    
             
    };

    DynamicTable.prototype.selectionMapRange = function() {
        let lowestRow = -1;
        let highestRow = -1;
        let lowestCol = -1;
        let highestCol = -1;

        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                if (this.selectionMap[i][j] === 1) {
                    if (lowestRow===-1) {
                        lowestRow = i;    
                        highestRow = i;   
                        lowestCol = j;  
                        highestCol = j;                
                    }
                    
                    if (lowestRow > i) {
                        lowestRow = i;
                    }
    
                    if (highestRow < i) {
                        highestRow = i;
                    }
    
                    if (lowestCol > j) {
                        lowestCol = j;
                    }
    
                    if (highestCol < j) {
                        highestCol = j;
                    }
                }                
            }
        }



        return [lowestRow,highestRow,lowestCol,highestCol];
    }

    DynamicTable.prototype.repaintRange = function(lowestRow,highestRow,lowestCol,highestCol) {            
        this.resetSelectionMap();
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                if ((i >= lowestRow && i <= highestRow) && (j >= lowestCol && j <= highestCol)) {
                    this.selectionMap[i][j] = 1;
                    const cellId = this.prefix + "_r" + (i+1) + "c" + (j+1);                                  
                    input = document.getElementById(cellId);                                   
                    if (input && !input.classList.contains('selected')) {                        
                        input.classList.add('selected');
                    }
                } else {
                    this.selectionMap[i][j] = 0;
                    const cellId = this.prefix + "_r" + (i+1) + "c" + (j+1);
                    input = document.getElementById(cellId);
                    if (input && input.classList.contains('selected')) {
                        input.classList.remove('selected');
                    }
                }
            }
        }
    };

        

    // Initialize event listeners for copy/paste
    DynamicTable.prototype.initEventListeners = function(input) {

        input.addEventListener('copy', this.handleCopy.bind(this));
        // Handle paste functionality
        input.addEventListener('paste', this.handlePaste.bind(this),false);        
        
    };

    DynamicTable.prototype.getSelectionArray = function() {
        let twoDArray = [];
        const [lowestRow,highestRow,lowestCol,highestCol] = this.selectionMapRange();

        for (let i = lowestRow; i <= highestRow; i++ ) {
            rowArray = [];
            for (let j = lowestCol; j <= highestCol; j++) {
                let element = document.getElementById(this.prefix+'_r'+(i+1)+'c'+(j+1));
                rowArray.push(element.value);
            }
            twoDArray.push(rowArray);
        }
        
        return twoDArray;
    };

    DynamicTable.prototype.copyToClipboard = function(event, text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text)
                .then(() => {
                    console.log('Text copied to clipboard');
                })
                .catch(err => {
                    console.error('Failed to copy text: ', err);
                });
        } else {
            event.clipboardData?.setData("text/plain", text);
            console.warn('Navigator API not supported in this browser');
        }
}

    // Handle copy functionality
    DynamicTable.prototype.handleCopy = function(event) {              
        var copiedData = this.getSelectionArray(); 
        var clipboardPasteDataFormat = copiedData.map(row => row.join('\t')).join('\n');          
        this.copyToClipboard(event, clipboardPasteDataFormat); 
        event.preventDefault();               
    };
    

    // Handle paste functionality
    DynamicTable.prototype.handlePaste = function(event) {

        event.preventDefault(); 
        let pastedData = "";

        if (event.clipboardData || window.clipboardData) {
            pastedData = (event.clipboardData || window.clipboardData).getData("text");
        } else {
            if (navigator.clipboard) {
                navigator.clipboard.readText()
                    .then(text => {
                        console.log('Pasted content from clipboard:', text);               
                        pastedData = text;                                                     
                        // Convert the pasted data into a 2D array
                        
                    })
                    .catch(err => {
                        console.error('Failed to read clipboard contents:', err);
                });
            } 
        }

        const rows = pastedData.trim().split('\n').map(row => row.trim()) ; // Split into rows by newline
                    
        const twoDArray = rows.map(row => row.split('\t')); // Split each row by tab (\t)        
        
        this.pasteDataToTable(twoDArray);        
        
    };

    DynamicTable.prototype.pasteDataToTable = function(twoDArray) {   
        const rowStart = this.pivotRow;
        const colStart = this.pivotCol;

        const [_, highestRow, __, highestCol] = this.selectionMapRange();
        
        if (twoDArray && twoDArray.length > 0) {

            let [maxRows,maxCols,isSingle] = (twoDArray.length === 1 && twoDArray[0].length ===1)? 
                                    [highestRow + 1 - rowStart,highestCol + 1 - colStart,true] : [twoDArray.length,twoDArray[0].length,false];            

            let addRows = Math.min(this.rows - rowStart, maxRows);
            let addCols = Math.min(this.cols - colStart, maxCols);            
            
            for (let i = rowStart; i < rowStart + addRows; i++) {
                for (let j = colStart; j < colStart + addCols; j++) {
                    let element = document.getElementById(this.prefix+'_r'+(i+1)+'c'+(j+1));
                    if (element.readOnly) {
                        continue;
                    }                   
                    let valueToPaste = isSingle ? twoDArray[0][0] : twoDArray[i-rowStart][j-colStart];
                    if (element.writeFunction) { //if there are specific limitations or exceptions to manage
                        element.writeFunction(element, valueToPaste);
                    } else {
                        element.value = valueToPaste;
                    }
                }
            }

            this.repaintRange(rowStart, rowStart + addRows-1, colStart, colStart + addCols -1 );

        }
        
    };

    //helper functions

    DynamicTable.prototype.addSpecialControls = function(input, options) {
        const specialKlass = options['specialControl']?.['class'];
        if (specialKlass) {
            input.classList.add(specialKlass);
        }
        let targetFunc = options['specialControl']?.['initializingFunction'];
        if (targetFunc) {
            this.specialControlFunctions.set(specialKlass,targetFunc);
        }
    };

    DynamicTable.prototype.setInput = function(columnOptions,row,col) {
        switch (columnOptions['input']) {
            case 'text': 
                var input = document.createElement('input');                
                input.type = 'text';                
                break;
            case 'decimal':                
                var input = document.createElement('input');
                input.type = 'text';
                input.precision = columnOptions['precision']+''||2;
                this.addDecimalEvents(input);
                break;
            case 'date':                
                var input = document.createElement('input');                
                input.type = 'date';                
                input.value = ''; 
                input.placeholder = '';              
                break;
            case 'select':                
                var input = document.createElement('select');
                addValuesToSelect(input,columnOptions);
                break;
            case 'div':
                var input = document.createElement('div');
                // var child = document.createElement('div');
                // input.appendChild(child);
                break;                
            default:                 
                var input = document.createElement('input');
                input.type = 'text';
        }
        setInputStandardOptions(this.prefix,input,row,col,columnOptions);
        if (typeof child !== 'undefined') {
            this.addSpecialControls(child, columnOptions);        
        }
        else {
            this.addSpecialControls(input, columnOptions);        
        }
        
        addInputEventHooks(input,columnOptions);
        return input;
    }

    function addInputEventHooks(input,options) {
        Object.entries(options['eventHook']||{}).forEach(
            function([event,funcHook]) {                  
                if (isValidEvent(input,event)) {               
                    //the first argument to bind, binds the 'this' element. The remaining arguments if any added,
                    //then are prepended to the function params. if you need event object as a param, add this in your definition post
                    //any planned prepended arguments. JS automatically adds the event object at the end    
                    input.addEventListener(event,funcHook.bind(input));
                }                
            }
        );        
    }
    
    function setInputStandardOptions(prefix, input,row,col,options) {        
        input.id = `${prefix}_r${row}c${col}`; // Assign ID in <row><col> format
        input.name = `${prefix}_r${row}c${col}`; // Assign name so it can be passed in form
        input.className = 'table-input'; // Class for styling the input           
        
        if (options['readonly']) {
            input.setAttribute('readonly', options['readonly']);            
        } 
    }

    function addValuesToSelect(input, options) {
        let values = options['values'] || [];
        values.forEach(function(val) 
        {
            const newOption = document.createElement("option");
            newOption.value = val;
            newOption.text = val;
            input.appendChild(newOption);
        });
    }

    function isValidEvent(element,eventName) {        
        return typeof element[`on${eventName}`] !== 'undefined';
    }

    //adding decimal field related event functions

    DynamicTable.prototype.addDecimalEvents = function(input) {
        input.addEventListener("input",this.onDecimalFocus.bind(this));
        input.addEventListener("blur",this.onDecimalBlur.bind(this));
        input.addEventListener("keydown",this.onDecimalKeydownEvent.bind(this));
        input.addEventListener("paste",this.onDecimalChangeEvent.bind(this));
        input.writeFunction = writeValueToDecimal;
        input.value = getInitialValue(input.precision);
    }

    DynamicTable.prototype.onDecimalChangeEvent = function(event) {
        const input = event.target;  
        const regex = new RegExp("^\\d+(\\.\\d{0," + input.precision + "})?$");// Regex to allow up to precision decimal places                       
        if (!regex.test(input.value)) {
            input.value = getInitialValue(input.precision);          
        }

    }

    DynamicTable.prototype.onDecimalBlur = function(event) {
        const input = event.target;  
        let value = input.value;
        if (!value) return;

        input.value = formatInputValue(value, input.precision);
    }        

    // Function to remove commas when the input is being given
    DynamicTable.prototype.onDecimalFocus = function(event) {
        const input = event.target;  
        input.value = input.value.replace(/,/g, '');
    }

    DynamicTable.prototype.onDecimalKeydownEvent = function(event) {
         // Get the value of the input field and simulate the new input if the key were added
        const input = event.target; 
        if ((event.metaKey || event.ctrlKey) && !event.shiftKey) {
            if ((['C','c'].includes(event.key))
                ||(['V','v'].includes(event.key))) {
                    return;
            }
        }                           
        
        // Allow control keys (e.g., backspace, delete, arrow keys)
        if (!this.decimalKeyRange.includes(event.key)) {
            event.preventDefault();
        } else {
            // Get the current caret position
            const caretPosition = input.selectionStart;
            // Get the current value of the input field
            const currentValue = input.value;
            const key = event.key;
            const newValue = currentValue.slice(0, caretPosition) + key + currentValue.slice(caretPosition);
            if (!this.controlKeys.includes(key) ) {
                const regex = new RegExp("^\\d+(\\.\\d{0," + input.precision + "})?$");// Regex to allow up to precision decimal places                       
                if (!regex.test(newValue)) {
                    event.preventDefault();
                }
            }                    
            
        }         
                                    
    }

    function formatInputValue(value, precision) {
        // Remove any existing commas
        value = value.replace(/,/g, '');
        
        let parts = value.split('.');
        //remove all leading zeros  
        parts[0] = parts[0].replace(/^0+/, '');
        parts[0] = parts[0] === ''? '0': parts[0];
        // Add commas to every third digit before the decimal point
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');                

        //in case of missing decimal point
        if (parts.length === 1 && precision > 0) {
            parts[1] = appendDecimalZeros(precision);
        }

        //if zeros are less then precision, replace remaining zeros
        if (parts[1].length < precision) {
            parts[1] = parts[1] + appendDecimalZeros(precision - parts[1].length);
        }

        return parts.join('.');
    }

    function appendDecimalZeros(precision) {
        if (precision && precision > 0) {
            let precision_arr = Array.from({ length: precision }, (_, i) => 0);
            if (precision_arr.length > 0) {
                return precision_arr.join('');
            }
        }
        return '';
    } 

    function adjustToPrecision(value, targetPrecision) {
        let parts = value.split('.');
        if (parts[1] && parts[1].length > targetPrecision) {
            parts[1] = parts[1].slice(0,targetPrecision);
        }
        return parts.join(".");
    }

    function writeValueToDecimal(input, value) {
        //remove any commas for testing with regexpression
        value = value.replace(/,/g, '');
        value = adjustToPrecision(value, input.precision);        
        const regex = new RegExp("^\\d+(\\.\\d{0," + input.precision + "})?$");// Regex to allow up to precision decimal places                       
        if (!regex.test(value)) {
            input.value = getInitialValue(input.precision);          
        } else {
            input.value = formatInputValue(value, input.precision);
        }
    }

    function getInitialValue(precision) {
        if (precision && precision > 0) {            
            return "0." + appendDecimalZeros(precision);            
        }        
        return "0";
    }
                                   

    return DynamicTable;
}));
