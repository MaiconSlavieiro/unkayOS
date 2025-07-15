export default pxToViewport = {
    vh: function (px) {
      px = parseFloat(px);
      const wh = window.innerHeight;
      return (px * 100) / wh + "vh";
    },
  
    vw: function (px) {
      px = parseFloat(px);
      const ww = window.innerWidth;
      return (px * 100) / ww + "vw";
    }
  };