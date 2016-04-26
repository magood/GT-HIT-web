
function call_load_functions_js() {
/*    console.log("call_load_functions");
    console.log(GC);
    console.log(jQuery);*/

//    GC.App.getPatient().refresh();

    // TODO we may need these functions after all, possibly modified, to prevent overlapping instances
    // of chart types contained in GC.App.Charts array that could cause more subtle bugs

//    charts__weight_chart_js(GC, jQuery);
//    charts__head_chart_js(GC, jQuery);
//    charts__length_chart_js(GC, jQuery);
//    charts__percentile_chart_js(GC, jQuery);
//    charts__body_mass_index_chart_js(GC, jQuery);

    gc_app_js(GC, jQuery);

}
