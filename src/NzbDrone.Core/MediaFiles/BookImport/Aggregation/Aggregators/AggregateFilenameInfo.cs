using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using NLog;
using NzbDrone.Common.Extensions;
using NzbDrone.Core.Parser.Model;

namespace NzbDrone.Core.MediaFiles.BookImport.Aggregation.Aggregators
{
    public class AggregateFilenameInfo : IAggregate<LocalEdition>
    {
        private readonly Logger _logger;

        private static readonly List<Tuple<string, string>> CharsAndSeps = new List<Tuple<string, string>>
        {
            Tuple.Create(@"a-z0-9,\(\)\.&'’\s", @"\s_-"),
            Tuple.Create(@"a-z0-9,\(\)\.\&'’_", @"\s-")
        };

        private static Regex[] Patterns(string chars, string sep)
        {
            var sep1 = $@"(?<sep>[{sep}]+)";
            var sepn = @"\k<sep>";
            var author = $@"(?<author>[{chars}]+)";
            var track = $@"(?<track>\d+)";
            var title = $@"(?<title>[{chars}]+)";
            var tag = $@"(?<tag>[{chars}]+)";

            return new[]
            {
                new Regex($@"^{track}{sep1}{author}{sepn}{title}{sepn}{tag}$", RegexOptions.IgnoreCase),
                new Regex($@"^{track}{sep1}{author}{sepn}{tag}{sepn}{title}$", RegexOptions.IgnoreCase),
                new Regex($@"^{track}{sep1}{author}{sepn}{title}$", RegexOptions.IgnoreCase),

                new Regex($@"^{author}{sep1}{tag}{sepn}{track}{sepn}{title}$", RegexOptions.IgnoreCase),
                new Regex($@"^{author}{sep1}{track}{sepn}{title}{sepn}{tag}$", RegexOptions.IgnoreCase),
                new Regex($@"^{author}{sep1}{track}{sepn}{title}$", RegexOptions.IgnoreCase),

                new Regex($@"^{author}{sep1}{title}{sepn}{tag}$", RegexOptions.IgnoreCase),
                new Regex($@"^{author}{sep1}{tag}{sepn}{title}$", RegexOptions.IgnoreCase),
                new Regex($@"^{author}{sep1}{title}$", RegexOptions.IgnoreCase),

                new Regex($@"^{track}{sep1}{title}$", RegexOptions.IgnoreCase),
                new Regex($@"^{track}{sep1}{tag}{sepn}{title}$", RegexOptions.IgnoreCase),
                new Regex($@"^{track}{sep1}{title}{sepn}{tag}$", RegexOptions.IgnoreCase),

                new Regex($@"^{title}$", RegexOptions.IgnoreCase),
            };
        }

        public AggregateFilenameInfo(Logger logger)
        {
            _logger = logger;
        }

        public LocalEdition Aggregate(LocalEdition release, bool others)
        {
            var tracks = release.LocalBooks;
            if (tracks.Any(x => x.FileTrackInfo.BookTitle.IsNullOrWhiteSpace())
                || tracks.Any(x => x.FileTrackInfo.AuthorTitle.IsNullOrWhiteSpace()))
            {
                _logger.Debug("Missing data in tags, trying filename augmentation");
                foreach (var charSep in CharsAndSeps)
                {
                    foreach (var pattern in Patterns(charSep.Item1, charSep.Item2))
                    {
                        var matches = AllMatches(tracks, pattern);
                        if (matches != null)
                        {
                            ApplyMatches(matches, pattern);
                        }
                    }
                }
            }

            return release;
        }

        private Dictionary<LocalBook, Match> AllMatches(List<LocalBook> tracks, Regex pattern)
        {
            var matches = new Dictionary<LocalBook, Match>();
            foreach (var track in tracks)
            {
                var filename = Path.GetFileNameWithoutExtension(track.Path).RemoveAccent();
                var match = pattern.Match(filename);
                _logger.Trace("Matching '{0}' against regex {1}", filename, pattern);
                if (match.Success && match.Groups[0].Success)
                {
                    matches[track] = match;
                }
                else
                {
                    return null;
                }
            }

            return matches;
        }

        private bool EqualFields(IEnumerable<Match> matches, string field)
        {
            return matches.Select(x => x.Groups[field].Value).Distinct().Count() == 1;
        }

        private void ApplyMatches(Dictionary<LocalBook, Match> matches, Regex pattern)
        {
            _logger.Debug("Got filename match with regex {0}", pattern);

            var keys = pattern.GetGroupNames();
            var someMatch = matches.First().Value;

            // only proceed if the 'tag' field is equal across all filenames
            if (keys.Contains("tag") && !EqualFields(matches.Values, "tag"))
            {
                _logger.Trace("Abort - 'tag' varies between matches");
                return;
            }

            // Given both an "author" and "title" field, assume that one is
            // *actually* the author, which must be uniform, and use the other
            // for the title. This, of course, won't work for VA books.
            string titleField;
            string author;
            if (keys.Contains("author"))
            {
                if (EqualFields(matches.Values, "author"))
                {
                    author = someMatch.Groups["author"].Value.Trim();
                    titleField = "title";
                }
                else if (EqualFields(matches.Values, "title"))
                {
                    author = someMatch.Groups["title"].Value.Trim();
                    titleField = "author";
                }
                else
                {
                    _logger.Trace("Abort - both author and title vary between matches");

                    // both vary, abort
                    return;
                }

                _logger.Debug("Got author from filename: {0}", author);

                foreach (var track in matches.Keys)
                {
                    if (track.FileTrackInfo.AuthorTitle.IsNullOrWhiteSpace())
                    {
                        track.FileTrackInfo.AuthorTitle = author;
                    }
                }
            }
            else
            {
                // no author - remaining field is the title
                titleField = "title";
            }

            // Apply the title and track
            foreach (var track in matches.Keys)
            {
                if (track.FileTrackInfo.BookTitle.IsNullOrWhiteSpace())
                {
                    var title = matches[track].Groups[titleField].Value.Trim();
                    _logger.Debug("Got title from filename: {0}", title);
                    track.FileTrackInfo.BookTitle = title;
                }

                var trackNums = track.FileTrackInfo.TrackNumbers;
                if (keys.Contains("track") && (trackNums.Count() == 0 || trackNums.First() == 0))
                {
                    var tracknum = Convert.ToInt32(matches[track].Groups["track"].Value);
                    if (tracknum > 100)
                    {
                        track.FileTrackInfo.DiscNumber = tracknum / 100;
                        _logger.Debug("Got disc number from filename: {0}", tracknum / 100);
                        tracknum = tracknum % 100;
                    }

                    _logger.Debug("Got track number from filename: {0}", tracknum);
                    track.FileTrackInfo.TrackNumbers = new[] { tracknum };
                }
            }
        }
    }
}
