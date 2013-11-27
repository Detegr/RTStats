Future=Npm.require("fibers/future");

var messagecache=null;
Meteor.setInterval(function()
{
	console.log("Clearing message cache");
	messagecache=null;
}, 10000);

function pad(num)
{
	if(num<10) return "0"+num;
	else return num;
}

Meteor.startup(function()
{
	function sortfunc(a,b)
	{
		if(a.nummessages < b.nummessages) return 1;
		else if(a.nummessages === b.nummessages) return 0;
		else return -1;
	}

	var client=new pg.Client("postgres://postgres@localhost/loggerdb");
	client.connect(function(err)
	{
		Meteor.methods({
			randommessages: function(rows) {
				var futures=_.map(rows, function(row)
				{
					var future=new Future();
					client.query("select message from messages where id=(select messageid from usermessages where userid=" +
						row.userid + " AND messagenum=(select floor(random()*" + row.nummessages + ")))",
					function(err, ret)
					{
						if(err) {
							future.resolver(err);
							return;
						}
						if(ret.rows[0])
						{
							future.resolver()(err, ret.rows[0].message);
						}
						else future.resolver()(err, "Undefined");
					});
					return future;
				});
				Future.wait(futures);
				return futures;
			},
			users: function()
			{
				console.log("Users called");
				var userfut=new Future();
				client.query("select * from users ORDER BY id", function(err,ret)
				{
					userfut.return(ret);
				});
				var users=userfut.wait().rows;
				var amountfut=new Future();
				client.query("select * from usermessageamounts ORDER BY userid", function(err, ret)
				{
					amountfut.return(ret);
				});
				var amounts=amountfut.wait().rows;
				var msgfut=new Future();
				var msgs;
				if(!messagecache)
				{
					msgs=Meteor.call("randommessages", amounts);
					messagecache=msgs;
				} else msgs=messagecache;
				for(var i=0, len=users.length; i<len; ++i)
				{
					users[i].nummessages=amounts[i].nummessages;
					users[i].randommessage=msgs[i].get();
				}
				users=users.sort(sortfunc);
				return users;
			},
			searchLog: function(str)
			{
				if(str.length < 5)
				{
					return [{msgid: "", msg: "Pistähän vähän pituutta siihen hakuun Arto."}];
				}
				var fut=new Future();
				client.query("select messages.id,users.name,message,time from messages INNER JOIN users ON users.id=messages.userid WHERE message ILIKE '%" + str + "%';", function(err, ret)
				{
					fut.return(ret);
				});
				var ret=fut.wait().rows;
				return _.map(fut.wait().rows, function(row)
				{
					var t=row.time;
					return {msgid: row.id, msg: t.getDate() + "." + (t.getMonth()+1) + "." + t.getFullYear() + " " + pad(t.getHours()) + ":" + pad(t.getMinutes()) + " <" + row.name + "> " + row.message};
				});
			},
			searchContext: function(msgid)
			{
				var fut=new Future();
				var msgid=parseInt(msgid, 10);
				client.query("select users.name,message,time from messages INNER JOIN users ON users.id=messages.userid WHERE messages.id >= " + Math.max(0, msgid-5) + " AND messages.id <= " + (msgid+5) + ";", function(err, ret)
				{
					fut.return(ret);
				});
				var ret=fut.wait().rows;
				return _.map(fut.wait().rows, function(row)
				{
					var t=row.time;
					return {msgid: row.id, msg: t.getDate() + "." + (t.getMonth()+1) + "." + t.getFullYear() + " " + pad(t.getHours()) + ":" + pad(t.getMinutes()) + " <" + row.name + "> " + row.message};
				});
			},
			getThisYearCounts: function()
			{
				var y=new Date().getFullYear();
				var futures=_.map([1,2,3,4,5,6,7,8,9,10,11,12], function(month)
				{
					var future=new Future();
					client.query("select count(*) from messages WHERE EXTRACT(month from time) =" + month + " AND EXTRACT(year from time) = " + y + ";", function(err, ret)
					{
						future.return(ret.rows[0]);
					});
					return future;
				});
				Future.wait(futures);
				var values=[];
				for(var i=0, len=futures.length; i<len; ++i)
				{
					var val=parseInt(futures[i].get().count, 10);
					if(val>0) values.push(val);
				}
				console.log(values);
				return values;
			}
		});
	});
});
