App.view = (function ($, render, state) {
  var tabs = ["results", "collection"];

  function init() {
    $(".tabs").on("click", ".tab", function () { selectTab($(this).attr("data-tab")); });
    $(".tabs").on("keydown", ".tab", onTabKey);
    $(".layout-btn").on("click", function () { render.setLayout($(this).attr("data-layout")); });
    render.setLayout(state.layout);
  }

  function selectTab(name) {
    $.each(tabs, function (_, tab) {
      var active = tab === name;
      $("#tab-" + tab).attr({ "aria-selected": active ? "true" : "false", tabindex: active ? "0" : "-1" });
      $("#panel-" + tab).prop("hidden", !active);
    });
  }

  function onTabKey(event) {
    var index = $.inArray($(this).attr("data-tab"), tabs);
    var next;
    if (event.key === "ArrowRight") { next = (index + 1) % tabs.length; }
    else if (event.key === "ArrowLeft") { next = (index + tabs.length - 1) % tabs.length; }
    else { return; }

    event.preventDefault();
    selectTab(tabs[next]);
    $("#tab-" + tabs[next]).trigger("focus");
  }

  return { init: init, selectTab: selectTab };
}(jQuery, App.render, App.state));
