﻿using System;
using System.Collections.Generic;
using Moq;
using NUnit.Framework;
using NzbDrone.Core.Blacklisting;
using NzbDrone.Core.Download;
using NzbDrone.Core.Qualities;
using NzbDrone.Core.Test.Framework;

namespace NzbDrone.Core.Test.Blacklisting
{
    [TestFixture]
    public class BlacklistServiceFixture : CoreTest<BlacklistService>
    {
        private DownloadFailedEvent _event;

        [SetUp]
        public void Setup()
        {
            _event = new DownloadFailedEvent
            {
                AuthorId = 12345,
                BookIds = new List<int> { 1 },
                Quality = new QualityModel(Quality.MP3_320),
                SourceTitle = "author.name.book.title",
                DownloadClient = "SabnzbdClient",
                DownloadId = "Sabnzbd_nzo_2dfh73k"
            };

            _event.Data.Add("publishedDate", DateTime.UtcNow.ToString("s") + "Z");
            _event.Data.Add("size", "1000");
            _event.Data.Add("indexer", "nzbs.org");
            _event.Data.Add("protocol", "1");
            _event.Data.Add("message", "Marked as failed");
        }

        [Test]
        public void should_add_to_repository()
        {
            Subject.Handle(_event);

            Mocker.GetMock<IBlacklistRepository>()
                .Verify(v => v.Insert(It.Is<Blacklist>(b => b.BookIds == _event.BookIds)), Times.Once());
        }

        [Test]
        public void should_add_to_repository_missing_size_and_protocol()
        {
            Subject.Handle(_event);

            _event.Data.Remove("size");
            _event.Data.Remove("protocol");

            Mocker.GetMock<IBlacklistRepository>()
                .Verify(v => v.Insert(It.Is<Blacklist>(b => b.BookIds == _event.BookIds)), Times.Once());
        }
    }
}
