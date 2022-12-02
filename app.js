
const express = require("express");
const bodyParser = require("body-parser");
const date = require( __dirname + "/date.js" );
const mongoose = require( "mongoose" );
const _ = require( "lodash" );

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect( "mongodb://localhost:27017/todolistDB", { useNewUrlParser: true } );

const itemSchema = new mongoose.Schema( {
  name: String
} );

const Item = mongoose.model( "Item", itemSchema );

const work = new Item( {
  name: "work"
} );

const home = new Item( {
  name: "home"
} );

const study = new Item( {
  name: "study"
} );

const defaultItems = [ work, home, study ];

const listSchema = new mongoose.Schema( {
  name: String,
  items: [ itemSchema ]
} );

const List = new mongoose.model( "List", listSchema );

app.get( "/", function ( req, res )
{
  Item.find( {}, function ( err, foundItems )
  {
    if ( foundItems.length === 0 )
    {
      Item.insertMany( defaultItems, function ( err )
      {
        if ( err )
        {
          console.log( err );
        } else
        {
          console.log( "Success" );
        };
      } );
      res.redirect( "/" );
    } else
    {
      res.render( "list", { listTitle: "Today", newListItems: foundItems } );
    }
  } );
} );

app.get( "/:type", ( req, res ) =>
{
  const customListName = _.capitalize(req.params.type);

  List.findOne( { name: customListName }, (err, foundList) =>
    {
    if ( !err )
    {
      if ( !foundList )
      {
        //Create a new list
        const list = new List( {
          name: customListName,
          items: defaultItems
        } );
      
        list.save();
        res.redirect( "/" + customListName );
      } else
      {
        //Show an existing list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items})
      };
    };
  } );
 
})

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item( {
    name: itemName
  } );

  if ( listName === "Today" )
  {
    item.save(); //This is the shortcut for mongo insert
    res.redirect( "/" );
  } else
  {
    List.findOne( { name: listName }, function ( err, foundList )
    {
      foundList.items.push( item );
      foundList.save();
      res.redirect( "/" + listName );
    })
  };
  
} );

app.post( "/delete", ( req, res ) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if ( listName === "Today" )
  {
    Item.findByIdAndRemove( checkedItemId, function ( err )
    {
      if ( !err )
      {
        console.log( "Removed successfully" );
        res.redirect( "/" );
      };
    } );
  } else
  {
    List.findOneAndUpdate( { name: listName }, { $pull: { items: { _id: checkedItemId } } }, function ( err, foundList )
    {
      if ( !err )
      {
        res.redirect( "/" + listName );
      }
    } );
  }

} );



app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
