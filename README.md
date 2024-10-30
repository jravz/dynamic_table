# DynamicTable

Dynamic Table has been created as a gem to enable creation of editable table of desired rows and columns. Users can interact and selectively enter data in cells like an Excel spreadsheet, copy-paste data, add and remove rows / columns dynamically i.e. programatically. Advanced capabilities like formulae are not expected at the moment.

## Installation

To install and use this gem:
1. add the following to your Gemfile > gem 'dynamic_table' 
2. Install the gem by running > gem install dynamic_table
3. In your application.js, require dynamic_table and import dynamic_table within your application.css / application.scss

### Dependencies
* Bootstrap
* jquery

## Usage

Within your js file or script, dynamic table can be initiated with the following instruction:
```
var varName = new DynamicTable(tableContainerName, rows:<num of rows>, cols: <num of rows>, columnOptions:<hash of columnOptions>, appliedClasses:<class to apply at various levels as a hash>)
```
Column options is used to defining specific columns and their contents. Its a Object hash that has the following options:
```
* headerName - <optional> Name of the header

*input: Input may be:
> 1. 'text' - Normal text field
> 2. 'decimal' - numeric values with decimal support
> 3. 'date' - date type
> 4. 'div' - a div is added

*precision: <optional> only for decimal input. Enter the number of digits after decimal point

*readonly: <optional> true or false. true by default

*eventhook: <optional> can add function hooks for events in a hashmap format like - {'change':()=>{...}, 'blur': functionVariableName}

*specialControl: you can associate other controls like datepicker, daterangepicker etc from existing libraries.
Format is {class: '<class to uniquely identify the cell>', initializingFunction: initializingFunctionName}
Within initializingFunctionName, you can associate the special control to the class mentioned therein

*tableId: unique table id to refer to the specific table control

*prefix: if there are more than one dynamictable on the page, its best to provide a prefix to avoid any overlaps in cell id naming
```
### Key Elements
The following classes can be used to refer to elements within the table for any additional controls or styling -
1. dynamic-table: refers to the table as a whole
2. table-input: refer to the control embedded within the td of the table

### Relevant functions
Call the following functions on the newly initialized object variable:
1. setValue: (tableVariableName, hashmap of values)
> An example of values hash is as below:
```
valuesHash = {
            "1": {"headerName1": "2024-07-01"},
            "2": {"headerName1": "2024-07-02","header2":"def"}
        }; 
```
> In the above example, "1" and "2" refer to row numbers that start from 1. Each column header name forms a key to which the value can be assigned.

2. getValue()
> returns as stringified hashmap of values in same form as the valuesHash above

3. getValueAsObject()
> same as above. Except in this case, the returning value is an Object

4. addRow()
> add a row at the end of the table. In the future, intervening rows deletion will be supported

5. addCol(colOptions)
> row can be added at the end, with colOptions

6. removeCol()
> removes last column

7. removeRow()
> removes last row

### Keyboard shortcuts
1. Cmd(or Ctrl) + C : copy value of cell or set of selected cells
2. Cmd(or Ctrl) + V : paste to cell or set of cells 
3. Cmd(or Ctrl) + Shift + Down: Select all cells from selected cell to end of column. Can be used to mass paste a similar value to all successive cells
4. Up / Down: Traverse up or down a column
5. Esc: lose focus

## Contributing

Bug reports and pull requests are welcome on GitHub at https://github.com/jravz/dynamic_table. This project is intended to be a safe, welcoming space for collaboration, and contributors are expected to adhere to best practices in conduct.


