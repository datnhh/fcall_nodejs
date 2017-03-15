function searchContact(_key,_callid,_userid,callback) {
    var dataSend = {
        key: _key,
        callid: _callid,
        userlogin: _userid
    };
    $.ajax({
        url: "/api/subscriber-search",
        type: "POST",
        data: dataSend,
        //async: false,
        success: function (data) {
            var listContact = JSON.parse(data.Value);
            if (listContact.code == 200) {                
                callback(listContact.result);
            }
            else {
                alert('Loi');
            }            
        },
        beforeSend: function (xhr) {            
        },
        error: function (jqXHR, textStatus, errorThrown) {            
        }
    });
}
function LoadContacts(_dept, callback) {
    var dataSend = {
        dept: _dept
    };
    $.ajax({
        url: "/api/subscriber-get-list",
        type: "POST",
        data: dataSend,
        //async: false,
        success: function (data) {
            var listContact = JSON.parse(data.Value);
            if (listContact.code == 200) {
                callback(listContact.result);
            }
            else {
                alert('Loi');
            }
        },
        beforeSend: function (xhr) {
        },
        error: function (jqXHR, textStatus, errorThrown) {
        }
    });
}