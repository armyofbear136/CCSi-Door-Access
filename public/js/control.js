function tryAccess() {
    // AJAX call that initiates access request
    $.ajax({
    type: "get",
    url: `${window.location.href}/controls/access`,
    });
  };
  function tryUnlock() {
    // AJAX call that initiates access request
    $.ajax({
    type: "get",
    url: `${window.location.href}/controls/unlock`,
    });
  };
  function tryLock() {
    // AJAX call that initiates access request
    $.ajax({
    type: "get",
    url: `${window.location.href}/controls/lock`,
    });
  };