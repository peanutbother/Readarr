using System.Collections.Generic;
using Nancy.Bootstrapper;
using Lidarr.Http;
using NzbDrone.Common.Composition;
using NzbDrone.Common.EnvironmentInfo;
using NzbDrone.Common.Http.Dispatchers;
using NzbDrone.SignalR;

namespace NzbDrone.Host
{
    public class MainAppContainerBuilder : ContainerBuilderBase
    {
        public static IContainer BuildContainer(StartupContext args)
        {
            var assemblies = new List<string>
                             {
                                 "NzbDrone.Host",
                                 "NzbDrone.Core",
                                 "NzbDrone.Api",
                                 "NzbDrone.SignalR",
                                 "Lidarr.Api.V3",
                                 "Lidarr.Http"
                             };

            return new MainAppContainerBuilder(args, assemblies).Container;
        }

        private MainAppContainerBuilder(StartupContext args, List<string> assemblies)
            : base(args, assemblies)
        {
            AutoRegisterImplementations<NzbDronePersistentConnection>();

            Container.Register<INancyBootstrapper, LidarrBootstrapper>();
            Container.Register<IHttpDispatcher, FallbackHttpDispatcher>();
        }
    }
}
